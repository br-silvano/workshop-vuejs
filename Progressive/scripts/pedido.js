const baseURL = 'http://localhost:3000';

Quasar.lang.set(Quasar.lang.ptBr);

new Vue({
  el: '#app',
  data: {
    busca: '',
    cliente: { nome: '' },
    dataEntrega: '',
    itens: []
  },
  methods: {
    async obterProdutos() {
      const { data: produtos } = await axios.get(`${baseURL}/produtos`);

      this.itens = produtos.map(produto => {
        return {
          produto: {
            id: produto.id,
            codigo: produto.codigo,
            descricao: produto.descricao,
            preco: produto.preco,
            codigoDescricao: produto.codigo + ' ' + produto.descricao,
          },
          quantidade: 0
        }
      });
    },

    precoVenda(item) {
      return parseFloat(parseInt(`0${item.quantidade}`) * item.produto.preco);
    },

    async onSubmit() {
      if (this.totalPedido === 0) {
        this.$q.notify({
          color: 'red-5',
          textColor: 'white',
          icon: 'warning',
          message: 'Você precisa digitar a quantidade'
        })
      }
      else {
        const { data: pedidos } = await axios.get(`${baseURL}/pedidos`);
        const maxId = Math.max(...pedidos.map(pedido => pedido.id));

        const data = {
          id: (maxId || 0) + 1,
          cliente: {...this.cliente},
          dataEntrega: this.dataEntrega,
          itens: this.itens.map(item => {
            if (item.quantidade > 0) {
              return {
                "produto": {
                  "id": item.produto.id,
                  "codigo": item.produto.codigo,
                  "descricao": item.produto.descricao
                },
                "quantidade": item.quantidade,
                "preco": item.produto.preco
              }
            }
          }).filter(el => el)
        };

        await axios.post(`${baseURL}/pedidos`, data);

        this.$q.notify({
          color: 'green-4',
          textColor: 'white',
          icon: 'cloud_done',
          message: 'Pedido enviado'
        })

        this.onReset();
        this.onInit();
      }
    },

    onReset() {
      this.busca = '';
      this.cliente = { nome: '' };
      this.dataEntrega = '';
      this.itens = [];
      this.$refs.form.resetValidation();
    },

    onInit() {
      this.obterProdutos();
    }
  },
  watch: {
    busca(value) {
      const regex = new RegExp(`${value.toLowerCase()}`, 'g');

      const itensFiltrados = this.itens.filter(({produto}) =>
        produto.codigoDescricao.toLowerCase().match(regex));

      const idsFiltrados = itensFiltrados.map(({produto}) => produto.id);

      const itensPrimeiraOrdem = this.itens.map(item => {
        if (idsFiltrados.includes(item.produto.id)) {
          return item
        }
      }).filter(item => item);

      const itensSegundaOrdem = this.itens.map(item => {
        if (!idsFiltrados.includes(item.produto.id)) {
          return item
        }
      }).filter(item => item);

      this.itens = [...itensPrimeiraOrdem, ...itensSegundaOrdem];
    },
  },
  computed: {
    totalPedido() {
      return this.itens.map(item =>
        parseFloat(parseInt(`0${item.quantidade}`) * item.produto.preco))
        .reduce((a, b) => a + b, 0);
    }
  },
  mounted() {
    this.onInit();
  },
  destroyed() {
    this.onReset();
  }
});
