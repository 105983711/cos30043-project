<script setup>
defineProps({ theme: { default: 'art' }, hero: Boolean });
</script>
<template>
  <div class="artwork" :class="[theme, { heroart: hero }]" aria-hidden="true">
    <svg viewBox="0 0 600 360" preserveAspectRatio="xMidYMid slice">
      <template v-if="theme === 'art'">
        <rect width="600" height="360" fill="#edb7a5" />
        <circle cx="450" cy="72" r="170" fill="#e06443" />
        <path d="M74 360V142a91 91 0 0 1 182 0v218" fill="#394c3d" />
        <path d="M108 360V148a57 57 0 0 1 114 0v212" fill="#e7dcc5" />
        <path
          d="m360 108 19 48 51-10-30 43 31 42-51-9-19 49-18-49-51 9 30-42-31-43 51 10Z"
          fill="#f6f0d8"
        />
        <path d="M360 350h240v-70H360z" fill="#cbd19c" />
        <circle cx="501" cy="280" r="70" fill="#f4c75f" />
        <path d="m0 285 75-26M0 309l75-26M0 333l75-26" stroke="#f7efdb" stroke-width="3" />
      </template>
      <template v-else-if="theme === 'tech'">
        <rect width="600" height="360" fill="#d7d2ef" />
        <circle cx="300" cy="180" r="145" fill="#b6a5da" />
        <rect
          x="115"
          y="68"
          width="370"
          height="224"
          rx="14"
          fill="#343e39"
          transform="rotate(-7 300 180)"
        />
        <rect
          x="134"
          y="90"
          width="332"
          height="171"
          rx="4"
          fill="#f5f0e8"
          transform="rotate(-7 300 180)"
        />
        <path
          d="m242 141-43 44 43 29m116-83 43 28-43 44m-34-81-37 97"
          stroke="#8870be"
          stroke-width="13"
          fill="none"
        />
        <path d="m489 47 8 25 27 2-22 16 5 26-21-16-24 14 9-25-20-18 27 1Z" fill="#e56a47" />
      </template>
      <template v-else-if="theme === 'sport'">
        <rect width="600" height="360" fill="#dce4b4" />
        <path
          d="M-90 330C40-130 610-80 700 280M-50 360C90-60 550-10 640 320M-10 390C140 20 490 60 580 360"
          fill="none"
          stroke="#7c925d"
          stroke-width="20"
        />
        <circle cx="290" cy="175" r="97" fill="#e9784d" />
        <path
          d="M193 175h194M290 78v194M221 107q139 70 0 136M359 107q-139 70 0 136"
          stroke="#623b30"
          stroke-width="4"
          fill="none"
        />
        <path d="m467 230 12 34 36 2-28 23 8 36-30-21-30 19 10-35-27-24 36 1Z" fill="#f8f1db" />
      </template>
      <template v-else-if="theme === 'social'">
        <rect width="600" height="360" fill="#e9c6d2" />
        <circle cx="100" cy="72" r="115" fill="#d991aa" />
        <rect
          x="190"
          y="85"
          width="167"
          height="167"
          rx="26"
          fill="#f6ebce"
          transform="rotate(-16 270 165)"
        />
        <rect
          x="315"
          y="125"
          width="167"
          height="167"
          rx="26"
          fill="#49604c"
          transform="rotate(15 400 200)"
        />
        <g fill="#49604c">
          <circle cx="238" cy="133" r="12" />
          <circle cx="302" cy="197" r="12" />
          <circle cx="270" cy="165" r="12" />
        </g>
        <g fill="#f6ebce">
          <circle cx="375" cy="171" r="12" />
          <circle cx="427" cy="225" r="12" />
          <circle cx="375" cy="225" r="12" />
          <circle cx="427" cy="171" r="12" />
        </g>
      </template>
      <template v-else-if="theme === 'career'">
        <rect width="600" height="360" fill="#c8dce9" />
        <path d="M80 360V250h100V180h100V110h100V40h100v320" fill="#607f99" />
        <path d="m126 178 168-115m-59-3 64-1-9 63" stroke="#f8efd5" stroke-width="16" fill="none" />
        <circle cx="450" cy="264" r="73" fill="#ed9367" />
      </template>
      <template v-else>
        <rect width="600" height="360" fill="#c6dbcb" />
        <circle cx="310" cy="167" r="140" fill="#f4edda" />
        <path
          d="M302 315V150m0 75C190 235 158 149 174 90c90 1 145 54 128 135m2-45C412 186 447 108 431 48c-88 2-142 48-127 132"
          fill="#678664"
          stroke="#3d5c45"
          stroke-width="7"
        />
        <path d="M252 275h115l-20 85h-76Z" fill="#ce7758" />
      </template>
    </svg>
    <span v-if="hero" class="art-stamp">MAKE TIME<br />FOR SOMETHING<br /><em>new.</em></span>
    <span v-if="hero" class="art-note">A little outside your routine. A lot to discover.</span>
  </div>
</template>
