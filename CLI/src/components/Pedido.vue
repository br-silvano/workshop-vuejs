<template>
  <q-page>
    <q-form
      @submit="onSubmit"
      @reset="onReset"
      class="q-pa-md"
      autocorrect="off"
      autocapitalize="off"
      autocomplete="off"
      spellcheck="false"
      ref="form"
    >
      <div class="row">
        <div class="col-xs-12 col-sm-6 col-md-3">
          <q-input
            v-model.trim="cliente.nome"
            label="Nome do cliente"
            lazy-rules
            :rules="[
              val => (val && val.length > 0) || 'Nome do cliente obrigatório',
            ]"
          />
        </div>
      </div>

      <div class="row">
        <div class="col-xs-12 col-sm-6 col-md-3">
          <q-input
            v-model="dataEntrega"
            label="Data de entrega"
            mask="##/##/####"
            lazy-rules
            :rules="[
              val =>
                (val && val.length === 10) || 'Data de entrega obrigatória',
            ]"
          >
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy
                  ref="qDateProxy"
                  transition-show="scale"
                  transition-hide="scale"
                >
                  <q-date
                    v-model="dataEntrega"
                    @input="() => $refs.qDateProxy.hide()"
                    mask="DD/MM/YYYY"
                  >
                    <div class="row items-center justify-end">
                      <q-btn
                        v-close-popup
                        label="Fechar"
                        color="primary"
                        flat
                      />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </div>
      </div>

      <br />

      <div class="text-subtitle1">Produto(s)</div>

      <div class="row">
        <div class="col-xs-12 col-sm-3">
          <q-input v-model.lazy.trim="busca" label="Procurar" />
        </div>
      </div>

      <div class="row" v-bind:key="index" v-for="(item, index) in itens">
        <div
          class="col-xs-12 col-sm-2"
          v-bind:class="{ 'item-destaque': index % 2 == 0 }"
        >
          <q-input v-model="item.produto.codigo" label="Código" disable />
        </div>
        <div
          class="col-xs-12 col-sm-4"
          v-bind:class="{ 'item-destaque': index % 2 == 0 }"
        >
          <q-input v-model="item.produto.descricao" label="Descrição" disable />
        </div>
        <div
          class="col-xs-12 col-sm-2"
          v-bind:class="{ 'item-destaque': index % 2 == 0 }"
        >
          <q-input
            v-model.number="item.quantidade"
            type="number"
            min="0"
            max="999"
            label="Quantidade"
          />
        </div>
        <div
          class="col-xs-12 col-sm-2"
          v-bind:class="{ 'item-destaque': index % 2 == 0 }"
        >
          <q-input
            v-model="item.produto.preco"
            label="Preço unitário"
            disable
          />
        </div>
        <div
          class="col-xs-12 col-sm-2"
          v-bind:class="{ 'item-destaque': index % 2 == 0 }"
        >
          <q-input :value="precoVenda(item)" label="Preço venda" disable />
        </div>
      </div>

      <br />
      <span class="text-weight-bolder">Valor do pedido: {{ totalPedido }}</span>

      <br /><br />
      <div>
        <q-btn label="Enviar" type="submit" color="primary" />
      </div>
    </q-form>
  </q-page>
</template>

<style>
.item-destaque {
  background-color: #e6e6fa;
}
</style>

<script>
import axios from 'axios';

const baseURL = 'http://localhost:3000';

export default {
  name: 'Pedido',
  data() {
    return {
      busca: '',
      cliente: {
        nome: '',
      },
      dataEntrega: '',
      itens: [],
    };
  },
  methods: {
    async obterProdutos() {
      const { data: produtos } = await axios.get(`${baseURL}/produtos`);

      this.itens = produtos.map(produto => ({
        produto: {
          id: produto.id,
          codigo: produto.codigo,
          descricao: produto.descricao,
          preco: produto.preco,
        },
        quantidade: 0,
      }));
    },

    precoVenda(item) {
      return parseFloat(
        parseInt(`0${item.quantidade}`, 0) * item.produto.preco,
      );
    },

    async onSubmit() {
      if (this.totalPedido === 0) {
        this.$q.notify({
          color: 'red-5',
          textColor: 'white',
          icon: 'warning',
          message: 'Você precisa digitar a quantidade',
        });
      } else {
        const { data: pedidos } = await axios.get(`${baseURL}/pedidos`);
        const maxId = Math.max(...pedidos.map(pedido => pedido.id));

        const data = {
          id: (maxId || 0) + 1,
          cliente: {
            ...this.cliente,
          },
          dataEntrega: this.dataEntrega,
          itens: this.itens
            .map(item => {
              if (item.quantidade > 0) {
                return {
                  produto: {
                    id: item.produto.id,
                    codigo: item.produto.codigo,
                    descricao: item.produto.descricao,
                  },
                  quantidade: item.quantidade,
                  preco: item.produto.preco,
                };
              }
            })
            .filter(el => el),
        };

        await axios.post(`${baseURL}/pedidos`, data);

        this.$q.notify({
          color: 'green-4',
          textColor: 'white',
          icon: 'cloud_done',
          message: 'Pedido enviado',
        });

        this.onReset();
        this.onInit();
      }
    },

    onReset() {
      this.busca = '';
      this.cliente = {
        nome: '',
      };
      this.dataEntrega = '';
      this.itens = [];
      this.$refs.form.resetValidation();
    },

    onInit() {
      this.obterProdutos();
    },
  },
  watch: {
    busca(value) {
      const regex = new RegExp(`${value.toLowerCase()}`, 'g');

      const itensFiltrados = this.itens.filter(({ produto }) =>
        `${produto.codigo} ${produto.Descricao}`.toLowerCase().match(regex),
      );

      const idsFiltrados = itensFiltrados.map(({ produto }) => produto.id);

      const itensPrimeiraOrdem = this.itens
        .map(item => {
          if (idsFiltrados.includes(item.produto.id)) {
            return item;
          }
        })
        .filter(item => item);

      const itensSegundaOrdem = this.itens
        .map(item => {
          if (!idsFiltrados.includes(item.produto.id)) {
            return item;
          }
        })
        .filter(item => item);

      this.itens = [...itensPrimeiraOrdem, ...itensSegundaOrdem];
    },
  },
  computed: {
    totalPedido() {
      return this.itens
        .map(item =>
          parseFloat(parseInt(`0${item.quantidade}`, 0) * item.produto.preco),
        )
        .reduce((a, b) => a + b, 0);
    },
  },
  mounted() {
    this.onInit();
  },
  destroyed() {
    this.onReset();
  },
};
</script>
