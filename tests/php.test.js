import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { once } from 'node:events';

test(
  'Mercury PHP adapter: sessions, roles, content, social, capacity, persistence',
  { skip: !process.env.PHP_BIN },
  async () => {
    const folder = await mkdtemp(join(tmpdir(), 'campus-php-'));
    const config = join(folder, 'config.php');
    await writeFile(config, "<?php return ['dsn'=>'sqlite:'.__DIR__.'/database.sqlite'];");
    const bin = process.env.PHP_BIN;
    const extensions = process.env.PHP_EXT;
    const options = [
      '-d',
      `extension_dir=${extensions}`,
      '-d',
      'extension=pdo_sqlite',
      '-d',
      `session.save_path=${folder}`,
    ];
    const env = {
      ...process.env,
      CAMPUS_CONFIG: config,
      CAMPUS_ADMIN_EMAIL: 'admin@example.test',
      CAMPUS_ADMIN_PASSWORD: 'admin-test-pass-123',
    };
    let result = spawnSync(bin, [...options, 'deploy/setup.php', config], {
      env,
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr + result.stdout);
    // Setup is idempotent; existing content/accounts must not be reset.
    result = spawnSync(bin, [...options, 'deploy/setup.php', config], { env, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr + result.stdout);
    let child;
    async function start() {
      child = spawn(bin, [...options, '-S', '127.0.0.1:3017', '-t', resolve('deploy')], {
        env,
        stdio: ['ignore', 'ignore', 'pipe'],
      });
      await once(child.stderr, 'data');
    }
    async function close() {
      if (child && !child.killed) {
        const done = once(child, 'exit');
        child.kill();
        await done;
      }
    }
    async function request(path, method = 'GET', body, cookie = '') {
      const r = await fetch('http://127.0.0.1:3017/api.php?path=' + path, {
        method,
        headers: { 'Content-Type': 'application/json', cookie },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
      return {
        status: r.status,
        data: await r.json(),
        cookie: r.headers.get('set-cookie')?.split(';')[0],
      };
    }
    try {
      await start();
      assert.equal((await request('/events')).data.length, 18);
      const registered = await request('/register', 'POST', {
        name: 'PHP Student',
        email: 'student@example.test',
        password: 'php-student-pass-123',
        role: 'admin',
      });
      assert.equal(registered.status, 201);
      assert.equal(registered.data.user.role, 'student');
      const student = registered.cookie;
      assert.equal((await request('/events', 'POST', {}, student)).status, 403);
      const login = await request('/login', 'POST', {
        email: 'admin@example.test',
        password: 'admin-test-pass-123',
      });
      assert.equal(login.status, 200);
      const admin = login.cookie;
      const clubBody = {
        name: 'PHP Test Club',
        category: 'Technology',
        initials: 'PT',
        color: 'mint',
        description: 'A club used to validate the Mercury compatible PHP backend.',
        contact: 'club@example.test',
      };
      const club = await request('/clubs', 'POST', clubBody, admin);
      assert.equal(club.status, 201);
      const eventBody = {
        title: 'PHP lifecycle test',
        clubId: club.data.id,
        category: 'Technology',
        date: '2099-12-10',
        time: '13:00',
        location: 'Library',
        price: 0,
        capacity: 1,
        description: 'A test event with one place to verify the PHP capacity limit.',
        artwork: 'tech',
      };
      const event = await request('/events', 'POST', eventBody, admin);
      assert.equal(event.status, 201);
      const id = event.data.id;
      assert.equal(
        (await request(`/events/${id}`, 'PUT', { ...eventBody, date: '2099-02-31' }, admin)).status,
        422
      );
      assert.equal(
        (
          await request(
            `/events/${id}`,
            'PUT',
            { ...eventBody, title: 'Updated PHP lifecycle' },
            admin
          )
        ).status,
        200
      );
      assert.equal(
        (
          await request(
            `/clubs/${club.data.id}`,
            'PUT',
            { ...clubBody, name: 'Updated PHP Club' },
            admin
          )
        ).status,
        200
      );
      assert.equal((await request(`/events/${id}`, 'DELETE', {}, student)).status, 403);
      assert.equal((await request(`/events/${id}/like`, 'POST', {}, student)).status, 200);
      assert.equal((await request(`/events/${id}/like`, 'POST', {}, student)).status, 200);
      assert.equal((await request(`/events/${id}`)).data.likes, 1);
      assert.equal((await request(`/events/${id}/registration`, 'POST', {}, student)).status, 200);
      assert.equal((await request(`/events/${id}/registration`, 'POST', {}, admin)).status, 409);
      assert.equal(
        (await request(`/clubs/${club.data.id}/membership`, 'POST', {}, student)).status,
        200
      );
      assert.equal((await request(`/clubs/${club.data.id}`, 'DELETE', {}, admin)).status, 409);
      const me = (await request('/me', 'GET', undefined, student)).data;
      await close();
      await start();
      assert.deepEqual((await request('/me', 'GET', undefined, student)).data, me);
      assert.equal(
        (await request(`/events/${id}/registration`, 'DELETE', {}, student)).status,
        200
      );
      assert.equal((await request(`/events/${id}/registration`, 'POST', {}, admin)).status, 200);
      assert.equal((await request(`/events/${id}`, 'DELETE', {}, admin)).status, 200);
      assert.equal((await request(`/events/${id}`)).status, 404);
      assert.equal((await request(`/clubs/${club.data.id}`, 'DELETE', {}, admin)).status, 200);
      await request('/logout', 'POST', {}, student);
      assert.equal((await request('/me', 'GET', undefined, student)).status, 401);
    } finally {
      await close();
      await rm(folder, { recursive: true, force: true });
    }
  }
);
