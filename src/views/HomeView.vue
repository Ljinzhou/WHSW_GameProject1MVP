<template>
  <div class="home">
    <h1>Game Demo Template</h1>
    <p>Welcome to the Phaser + Vue 3 Game Template</p>
    <router-link to="/game" class="btn">Start Game</router-link>
  </div>
</template>

<script setup lang="ts">
// 首页逻辑
</script>

<style scoped>
.home {
  text-align: center;
  padding: 2rem;
}
.btn {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: #42b883;
  color: white;
  text-decoration: none;
  border-radius: 4px;
}
</style>
