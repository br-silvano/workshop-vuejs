<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="glossy">
      <q-toolbar>
        <q-toolbar-title>
          Pedido
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <Pedido />
    </q-page-container>
  </q-layout>
</template>

<script>
import Pedido from './components/Pedido.vue';

export default {
  name: 'LayoutDefault',
  components: {
    Pedido,
  },

  data() {
    return {
      leftDrawerOpen: false,
    };
  },
};
</script>

<style></style>
