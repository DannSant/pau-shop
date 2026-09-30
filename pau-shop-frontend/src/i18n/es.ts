export const es = {
  navbar: {
    brand: "PauShop",
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
    featured: "Productos Destacados",
    loading: "Cargando productos...",
    noFeatured: "No hay productos destacados."
  },
  cart: {
    yourCart: "Tu Carrito",
    empty: "Tu carrito está vacío",
    checkout: "Proceder al pago",
    total: "Total",
    remove: "Eliminar",
    quantity: "Cantidad",
    browse: "Explorar Productos",
    productNotFound: "Producto no encontrado",
    insufficientStock: "No hay suficiente stock"
  },
  browse: {
    categories: "Categorías",
    franchises: "Franquicias",
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
    checkout: "Proceder al pago",
    loading: "Cargando...",
    notFound: "Producto no encontrado",
    addedToCart: (name: string) => `${name} se agregó al carrito`
  },
  checkout: {
    title: "Finalizar compra",
    shippingAddress: "Dirección de envío",
    orderSummary: "Resumen del pedido",
    subtotal: "Subtotal",
    tax: "Impuesto de California (8.5%)",
    importTax: "Impuesto de importación (16%)",
    shipping: "Envío",
    total: "Total",
    payNow: "Pagar ahora",
    selectAddressFirst: "Selecciona una dirección primero"
  },
  address: {
    title: "Dirección de envío",
    firstName: "Nombre",
    lastName: "Apellido",
    street: "Calle",
    exteriorNumber: "Número exterior",
    interiorNumber: "Número interior (opcional)",
    neighborhood: "Colonia",
    city: "Ciudad",
    state: "Estado",
    postalCode: "Código postal",
    phone: "Teléfono",
    useAnother: "Usar otra dirección",
    addNew: "Agregar nueva dirección",
    edit: "Editar dirección",
    useThis: "Usar esta dirección",
    cancel: "Cancelar"
  },
  orderSuccess: {
    title: "¡Gracias por tu compra!",
    paidOn: (date: string) => `Tu pedido se pagó el ${date}.`,
    placed: "Tu pedido se realizó con éxito.",
    notFound: "No encontramos tu pedido",
    viewOrders: "Ver mis pedidos",
    orderDate: "Fecha del pedido",
    paymentStatus: "Estado del pago",
    paidOnShort: (date: string) => `Pagado el ${date}`
  },
  login: {
    title: "Iniciar sesión en tu cuenta",
    email: "Correo electrónico",
    password: "Contraseña",
    submit: "Iniciar sesión",
    submitting: "Iniciando sesión...",
    failed: "No pudimos iniciar sesión. Inténtalo de nuevo.",
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
    failed: "No pudimos crear tu cuenta. Inténtalo de nuevo.",
    haveAccount: "¿Ya tienes una cuenta? Inicia sesión",
    orDivider: "o",
    googleButton: "Continuar con Google",
    checkEmailTitle: "Revisa tu correo",
    checkEmailBody:
      "Te enviamos un correo para confirmar tu cuenta. Confírmalo antes de iniciar sesión.",
    backToLogin: "Volver a iniciar sesión"
  },
  // Keyed by Supabase auth error code; pages fall back to their own `failed` text.
  authErrors: {
    invalid_credentials: "Correo o contraseña incorrectos.",
    email_not_confirmed: "Confirma tu correo antes de iniciar sesión.",
    user_already_exists: "Ya existe una cuenta con este correo.",
    weak_password: "La contraseña es demasiado débil. Usa al menos 6 caracteres.",
    email_address_invalid: "El correo electrónico no es válido.",
    over_email_send_rate_limit:
      "Se enviaron demasiados correos. Espera unos minutos e inténtalo de nuevo.",
    over_request_rate_limit:
      "Demasiados intentos. Espera unos minutos e inténtalo de nuevo."
  } as Record<string, string>,
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
    loadError: "No pudimos cargar tu perfil.",
    saveError: "No pudimos guardar los cambios. Inténtalo de nuevo."
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
