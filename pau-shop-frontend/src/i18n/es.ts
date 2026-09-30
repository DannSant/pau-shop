export const es = {
  navbar: {
    home: "Inicio",
    products: "Productos",
    browse: "Explorar",
    cart: "Carrito",
    login: "Iniciar sesión",
    profile: "Perfil"
  },
  home: {
    title: "Bienvenido a PauShop",
    description:
      "Descubre los mejores productos con ofertas exclusivas. Calidad, buen precio y envío rápido.",
    featured: "Productos Destacados"
  },
  cart: {
    yourCart: "Tu Carrito",
    empty: "Tu carrito está vacío",
    checkout: "Proceder al pago",
    total: "Total",
    remove: "Eliminar",
    quantity: "Cantidad",
    browse: "Explorar Productos"
  },
  browswe: {
    categories: "Categorías",
    all: "Todas",
    noProducts: "No hay productos.",
    products: "Productos"
  },
  common: {
    price: "Precio",
    offerPrice: "Precio con oferta",
    noImage: "Sin imagen"
  },
  product: {
    addToCart: "Agregar al carrito",
    outOfStock: "Agotado",
    inStock: "Disponibles",
    similarProducts: "Productos similares",
    checkout: "Proceder al pago"
  },
  login: {
    title: "Iniciar sesión en tu cuenta",
    email: "Correo electrónico",
    password: "Contraseña",
    submit: "Iniciar sesión",
    noAccount: "¿No tienes una cuenta? Regístrate",
    logout: "Cerrar sesión"
  },
  signup: {
    title: "Crea tu cuenta",
    name: "Nombre completo",
    phone: "Teléfono",
    email: "Correo electrónico",
    password: "Contraseña",
    confirmPassword: "Confirmar contraseña",
    submit: "Registrarme",
    submitting: "Registrando...",
    passwordMismatch: "Las contraseñas no coinciden",
    haveAccount: "¿Ya tienes una cuenta? Inicia sesión",
    orDivider: "o",
    googleButton: "Continuar con Google",
    checkEmailTitle: "Revisa tu correo",
    checkEmailBody:
      "Te enviamos un correo para confirmar tu cuenta. Confírmalo antes de iniciar sesión.",
    backToLogin: "Volver a iniciar sesión"
  },
  profile: {
    title: "Mi perfil",
    tabGeneral: "General",
    tabOrders: "Historial de pedidos",
    name: "Nombre",
    email: "Correo electrónico",
    phone: "Teléfono",
    memberSince: "Miembro desde",
    noPhone: "Sin teléfono",
    phoneMissing:
      "Agrega tu número de teléfono: lo necesitamos para contactarte al enviar tus pedidos.",
    edit: "Editar",
    save: "Guardar",
    saving: "Guardando...",
    cancel: "Cancelar",
    saved: "Perfil actualizado",
    loading: "Cargando tu perfil...",
    loadError: "No pudimos cargar tu perfil."
  },
  orders: {
    loading: "Cargando tus pedidos...",
    empty: "Aún no has realizado ningún pedido.",
    items: "Artículos",
    andMore: (n: number) => `y ${n} más`,
    date: "Fecha",
    status: {
      pending: "Pendiente",
      paid: "Pagado",
      shipped: "Enviado",
      delivered: "Entregado",
      cancelled: "Cancelado"
    } as Record<string, string>,
    detailTitle: "Detalle del pedido",
    orderNumber: "Número de pedido",
    quantity: "Cantidad",
    subtotal: "Subtotal",
    tax: "Impuestos",
    importTax: "Impuesto de importación",
    shipping: "Envío",
    total: "Total",
    shippingStatus: "Estado del envío",
    comingSoon: "Disponible próximamente",
    back: "Volver al historial",
    detailLoading: "Cargando tu pedido...",
    notFound: "No encontramos este pedido"
  }
};
