import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../server/index.js';

test('complete account, ownership, CRUD, social, capacity, and persistence lifecycle', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'campus-test-'));
  const database = join(folder, 'test.sqlite');
  let app = createApp({ database });
  await new Promise((r) => app.server.listen(0, '127.0.0.1', r));
  let base = `http://127.0.0.1:${app.server.address().port}/api`;
  async function request(path, method = 'GET', body, cookie = '') {
    const res = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json', cookie },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    return {
      status: res.status,
      data: await res.json(),
      cookie: res.headers.get('set-cookie')?.split(';')[0],
    };
  }
  async function close() {
    await new Promise((r) => app.server.close(r));
  }
  try {
    assert.equal((await request('/events')).data.length, 18);
    assert.equal((await request('/clubs')).data.length, 6);
    assert.equal((await request('/me')).status, 401);
    assert.equal(
      (await request('/register', 'POST', { name: 'X', email: 'bad', password: 'short' })).status,
      422
    );
    const signup = await request('/register', 'POST', {
      name: 'Test Student',
      email: 'student@example.test',
      password: 'test-password-123',
      role: 'admin',
    });
    assert.equal(signup.status, 201);
    assert.equal(signup.data.user.role, 'student');
    const student = signup.cookie;
    assert.equal(
      (
        await request('/register', 'POST', {
          name: 'Other',
          email: 'student@example.test',
          password: 'test-password-123',
        })
      ).status,
      409
    );
    assert.equal(
      (await request('/login', 'POST', { email: 'student@example.test', password: 'wrong' }))
        .status,
      401
    );
    assert.equal((await request('/events', 'POST', {}, student)).status, 403);
    assert.equal((await request('/events/1/like', 'POST', {}, student)).status, 200);
    await request('/events/1/like', 'POST', {}, student);
    assert.equal((await request('/events/1')).data.likes, 1);
    assert.deepEqual((await request('/me', 'GET', undefined, student)).data.liked, [1]);
    assert.equal((await request('/events/1/registration', 'POST', {}, student)).status, 200);
    assert.equal((await request('/clubs/1/membership', 'POST', {}, student)).status, 200);
    const organizerAccount = await request('/register', 'POST', {
      name: 'Organizer',
      email: 'organizer@example.test',
      password: 'organizer-pass-123',
    });
    app.db
      .prepare("UPDATE users SET role='organizer' WHERE id=?")
      .run(organizerAccount.data.user.id);
    const organizer = organizerAccount.cookie;
    const clubBody = {
      name: 'Test Club',
      category: 'Technology',
      initials: 'TC',
      color: 'mint',
      description: 'A test club with a description long enough to meet the requirements.',
      contact: 'club@example.test',
    };
    const club = await request('/clubs', 'POST', clubBody, organizer);
    assert.equal(club.status, 201);
    const eventBody = {
      title: 'Test capacity event',
      clubId: club.data.id,
      category: 'Technology',
      date: '2099-12-10',
      time: '14:00',
      location: 'Library',
      price: 0,
      capacity: 1,
      description: 'An integration test event for capacity, CRUD, and server authorization.',
      artwork: 'tech',
    };
    const created = await request('/events', 'POST', eventBody, organizer);
    assert.equal(created.status, 201);
    const id = created.data.id;
    assert.equal(
      (await request(`/events/${id}`, 'PUT', { ...eventBody, title: 'Not permitted' }, student))
        .status,
      403
    );
    const second = await request('/register', 'POST', {
      name: 'Other Organizer',
      email: 'other@example.test',
      password: 'another-pass-123',
    });
    app.db.prepare("UPDATE users SET role='organizer' WHERE id=?").run(second.data.user.id);
    assert.equal((await request(`/events/${id}`, 'DELETE', {}, second.cookie)).status, 403);
    assert.equal(
      (await request(`/events/${id}`, 'PUT', { ...eventBody, date: '2099-02-31' }, organizer))
        .status,
      422
    );
    assert.equal(
      (await request(`/events/${id}`, 'PUT', { ...eventBody, capacity: 0 }, organizer)).status,
      422
    );
    assert.equal(
      (
        await request(
          `/events/${id}`,
          'PUT',
          { ...eventBody, title: 'Updated capacity event' },
          organizer
        )
      ).status,
      200
    );
    assert.equal((await request(`/events/${id}/registration`, 'POST', {}, student)).status, 200);
    assert.equal(
      (await request(`/events/${id}/registration`, 'POST', {}, second.cookie)).status,
      409
    );
    assert.equal((await request(`/clubs/${club.data.id}`, 'DELETE', {}, organizer)).status, 409);
    assert.equal(
      (
        await request(
          `/clubs/${club.data.id}`,
          'PUT',
          { ...clubBody, name: 'Updated Test Club' },
          organizer
        )
      ).status,
      200
    );
    const cross = await fetch(base + '/events/1/like', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: student,
        Origin: 'https://evil.example',
      },
      body: '{}',
    });
    assert.equal(cross.status, 403);
    const before = await request('/me', 'GET', undefined, student);
    await close();
    app = createApp({ database });
    await new Promise((r) => app.server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${app.server.address().port}/api`;
    assert.deepEqual((await request('/me', 'GET', undefined, student)).data, before.data);
    assert.equal((await request(`/events/${id}`)).data.title, 'Updated capacity event');
    assert.equal((await request(`/events/${id}/registration`, 'DELETE', {}, student)).status, 200);
    assert.equal(
      (await request(`/events/${id}/registration`, 'POST', {}, second.cookie)).status,
      200
    );
    assert.equal((await request(`/events/${id}`, 'DELETE', {}, organizer)).status, 200);
    assert.equal((await request(`/events/${id}`)).status, 404);
    assert.equal((await request(`/clubs/${club.data.id}`, 'DELETE', {}, organizer)).status, 200);
    await request('/events/1/like', 'DELETE', {}, student);
    await request('/clubs/1/membership', 'DELETE', {}, student);
    assert.equal((await request('/events/1')).data.likes, 0);
    await request('/logout', 'POST', {}, student);
    assert.equal((await request('/me', 'GET', undefined, student)).status, 401);
  } finally {
    await close();
    await rm(folder, { recursive: true, force: true });
  }
});
