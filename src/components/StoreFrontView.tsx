import React, { useState, useMemo, useRef } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { CatalogRecipe, CartItem } from '../types';
import {
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Truck,
  Upload,
  Layers,
  Clock,
  CheckCircle,
  X,
  Search,
  ArrowRight,
  ChevronRight,
  Info,
  MapPin,
  Phone,
  Mail,
  Zap,
  Lock,
  Plus,
  Minus,
  Trash2,
  FileCheck,
  Eye,
  Check,
  MessageCircle,
} from 'lucide-react';

export const StoreFrontView: React.FC = () => {
  const { catalog, submitWebOrder, submitCustomWebQuote, setActiveTab } = useWorkshop();

  // Navigation tabs inside StoreFront
  const [activeStoreSection, setActiveStoreSection] = useState<'catalog' | 'custom_quote' | 'contact'>('catalog');

  // Filter & Search in Catalog
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState<CatalogRecipe | null>(null);

  // Product Detail Selection
  const [selectedQty, setSelectedQty] = useState(1);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');

  // Checkout Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingMethod, setShippingMethod] = useState<'uber_flash' | 'paqueteria' | 'counter'>('uber_flash');

  // Stripe Mock Card Form State
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [cardHolder, setCardHolder] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [orderSuccessReceipt, setOrderSuccessReceipt] = useState<{
    folio: string;
    total: number;
    itemsCount: number;
  } | null>(null);

  // Custom 3D Design Request State (REQ 3 Módulo 3)
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [customFileName, setCustomFileName] = useState('');
  const [customFileSize, setCustomFileSize] = useState('');
  const [customMaterial, setCustomMaterial] = useState('PETG Resistente / Exterior');
  const [customColor, setCustomColor] = useState('Negro Ónix');
  const [customQuantity, setCustomQuantity] = useState(1);
  const [customInstructions, setCustomInstructions] = useState('');
  const [customClientName, setCustomClientName] = useState('');
  const [customClientPhone, setCustomClientPhone] = useState('');
  const [customClientEmail, setCustomClientEmail] = useState('');
  const [customCity, setCustomCity] = useState('Ciudad de México');
  const [customQuoteSuccess, setCustomQuoteSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter published catalog items
  const publishedProducts = useMemo(() => {
    return catalog.filter((recipe) => {
      if (recipe.isPublishedInStore === false) return false;
      const q = searchTerm.toLowerCase().trim();
      const matches =
        !q ||
        recipe.title.toLowerCase().includes(q) ||
        recipe.subtitle.toLowerCase().includes(q) ||
        recipe.category.toLowerCase().includes(q) ||
        recipe.tags.some((t) => t.toLowerCase().includes(q));

      if (!matches) return false;
      if (selectedCategory !== 'all') return recipe.category === selectedCategory;
      return true;
    });
  }, [catalog, searchTerm, selectedCategory]);

  const categories = useMemo(() => {
    const list = Array.from(new Set(catalog.map((c) => c.category)));
    return ['all', ...list];
  }, [catalog]);

  // Cart Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  }, [cart]);

  const shippingCost = useMemo(() => {
    if (cart.length === 0) return 0;
    if (shippingMethod === 'counter') return 0;
    if (shippingMethod === 'uber_flash') return 85;
    return 140;
  }, [cart, shippingMethod]);

  const vatAmount = useMemo(() => {
    return Number((cartSubtotal * 0.16).toFixed(2));
  }, [cartSubtotal]);

  const cartTotal = useMemo(() => {
    return cartSubtotal + shippingCost + vatAmount;
  }, [cartSubtotal, shippingCost, vatAmount]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  // Add to Cart
  const handleAddToCart = (product: CatalogRecipe, qty: number, color?: string, mat?: string) => {
    const itemColor = color || product.recommendedFilaments[0]?.name || 'Estándar';
    const itemMat = mat || product.materials[0] || 'PETG';
    const existingIndex = cart.findIndex(
      (c) => c.recipe.id === product.id && c.selectedColor === itemColor && c.selectedMaterial === itemMat
    );

    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += qty;
      setCart(newCart);
    } else {
      setCart((prev) => [
        ...prev,
        {
          id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          recipe: product,
          quantity: qty,
          selectedColor: itemColor,
          selectedMaterial: itemMat,
          unitPrice: product.suggestedPrice,
        },
      ]);
    }

    setSelectedProductForModal(null);
    setIsCartDrawerOpen(true);
  };

  const handleUpdateCartQty = (id: string, newQty: number) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((c) => c.id !== id));
    } else {
      setCart((prev) => prev.map((c) => (c.id === id ? { ...c, quantity: newQty } : c)));
    }
  };

  // Open Product Modal
  const handleOpenProductDetail = (product: CatalogRecipe) => {
    setSelectedProductForModal(product);
    setSelectedQty(1);
    setSelectedColor(product.recommendedFilaments[0]?.name || 'Color Taller');
    setSelectedMaterial(product.materials[0] || 'PETG');
  };

  // Stripe Payment Execution
  const handleProcessStripePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!customerName.trim() || !customerPhone.trim() || !customerEmail.trim()) {
      alert('Por favor ingresa tus datos de contacto y envío completos.');
      return;
    }

    setIsProcessingPayment(true);

    setTimeout(() => {
      const paymentId = `ch_stripe_${Math.random().toString(36).substring(2, 10)}`;
      const order = submitWebOrder({
        items: cart,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        shippingAddress:
          shippingMethod === 'counter'
            ? 'Recoger en Taller KiMO CDMX (Roma Norte)'
            : shippingAddress.trim() || 'Dirección CDMX',
        shippingMethod,
        shippingCost,
        subtotal: cartSubtotal,
        vatAmount,
        total: cartTotal,
        stripePaymentId: paymentId,
      });

      setIsProcessingPayment(false);
      setIsCheckoutModalOpen(false);
      setCart([]);
      setOrderSuccessReceipt({
        folio: order.folio,
        total: cartTotal,
        itemsCount: cartItemCount,
      });
    }, 1200);
  };

  // Custom File Upload
  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomFile(file);
      setCustomFileName(file.name);
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setCustomFileSize(`${sizeMb} MB`);
    }
  };

  // Submit Custom 3D Quote Request (REQ 3 Módulo 3)
  const handleSubmitCustomQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customClientName.trim() || !customClientPhone.trim()) {
      alert('Por favor ingresa al menos tu nombre y WhatsApp de contacto.');
      return;
    }

    const savedQuote = submitCustomWebQuote({
      fileName: customFileName || 'Pieza Personalizada 3D',
      fileSize: customFileSize || '1.5 MB',
      material: customMaterial,
      color: customColor,
      quantity: customQuantity,
      specialInstructions: customInstructions.trim(),
      clientName: customClientName.trim(),
      clientPhone: customClientPhone.trim(),
      clientEmail: customClientEmail.trim() || 'cliente@kimo3d.com',
      city: customCity.trim() || 'CDMX',
    });

    setCustomQuoteSuccess(savedQuote.folio);
    setCustomFileName('');
    setCustomFile(null);
    setCustomInstructions('');
  };

  return (
    <div className="w-full flex flex-col min-h-screen bg-[#FAF7F0] text-[#1C1C18] selection:bg-[#EADDFB] selection:text-[#350463]">
      {/* 1. STORE COMMERCIAL HERO & TOP NAVIGATION (REQ 3) */}
      <section className="w-full bg-gradient-to-b from-[#350463] via-[#4C237A] to-[#350463] text-white pt-8 pb-12 px-4 sm:px-8 rounded-b-3xl sm:rounded-b-[40px] shadow-lg relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#C0F441]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -left-20 w-80 h-80 bg-[#6D3ACD]/30 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-[1400px] mx-auto flex flex-col gap-6 relative z-10">
          {/* Top Bar inside hero */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-white/15">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#C0F441] text-[#2E3F00] flex items-center justify-center font-black text-base shadow-md">
                K3D
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                  KiMO 3D Store
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C0F441] text-[#2E3F00] font-black uppercase tracking-wider">
                    Online
                  </span>
                </span>
                <span className="text-xs text-white/80 font-medium">
                  Laboratorio de Manufactura Aditiva & Prototipado Rápido • CDMX
                </span>
              </div>
            </div>

            {/* Cart & Internal Switch Buttons */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsCartDrawerOpen(true)}
                className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer relative shadow-sm"
              >
                <ShoppingBag className="w-4 h-4 text-[#C0F441]" />
                <span>Carrito ({cartItemCount})</span>
                {cartItemCount > 0 && (
                  <span className="font-mono font-black text-[#C0F441] ml-1">
                    ${cartSubtotal.toFixed(0)} MXN
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="px-3.5 py-2.5 rounded-full bg-white text-[#350463] hover:bg-[#EADDFB] text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                title="Regresar al Centro de Operaciones interno"
              >
                <span>⚙️ Panel Taller</span>
              </button>
            </div>
          </div>

          {/* Hero Banner Text */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-2">
            <div className="max-w-2xl space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[#C0F441] text-xs font-bold border border-white/15">
                <Sparkles className="w-3.5 h-3.5" />
                Piezas Producidas en Bambu Lab A1 & Resina SLA con Acabados de Taller
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Diseño e Impresión 3D Profesional a tu Puerta.
              </h1>
              <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
                Compra piezas listas para entrega en CDMX o sube tus propios archivos 3D (.STL/.STEP) para recibir cotización en menos de 2 horas.
              </p>
            </div>

            {/* Feature Badges */}
            <div className="grid grid-cols-2 gap-2 shrink-0">
              <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 text-left text-xs">
                <Truck className="w-4 h-4 text-[#C0F441] mb-1" />
                <span className="font-bold block text-white text-[11px]">Envíos CDMX Mismo Día</span>
                <span className="text-[10px] text-white/70">Vía Uber Flash & Nacional</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 text-left text-xs">
                <ShieldCheck className="w-4 h-4 text-[#C0F441] mb-1" />
                <span className="font-bold block text-white text-[11px]">Garantía de Tolerancia</span>
                <span className="text-[10px] text-white/70">100% Reposición por Falla</span>
              </div>
            </div>
          </div>

          {/* Nav Pills for Store Modules */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveStoreSection('catalog')}
              className={`px-4 py-2 rounded-2xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
                activeStoreSection === 'catalog'
                  ? 'bg-[#C0F441] text-[#2E3F00] shadow-md scale-105'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <span>🛍️ Catálogo de Productos</span>
              <span className="text-[10px] font-mono opacity-80">({publishedProducts.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveStoreSection('custom_quote')}
              className={`px-4 py-2 rounded-2xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
                activeStoreSection === 'custom_quote'
                  ? 'bg-[#C0F441] text-[#2E3F00] shadow-md scale-105'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <span>📐 Cotizar Pieza Personalizada (.STL / .STEP)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveStoreSection('contact')}
              className={`px-4 py-2 rounded-2xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
                activeStoreSection === 'contact'
                  ? 'bg-[#C0F441] text-[#2E3F00] shadow-md scale-105'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <span>📍 Taller & Recolección CDMX</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. MAIN STORE CONTENT CONTAINER */}
      <main className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 py-8 flex-1">
        {/* ======================================================== */}
        {/* SECCIÓN 1: CATÁLOGO DE PRODUCTOS DIRECTOS (REQ 3 MÓDULO 1) */}
        {/* ======================================================== */}
        {activeStoreSection === 'catalog' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Search & Category Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#CDC3D2]/40 shadow-xs">
              <div className="relative flex-1 min-w-[260px]">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4B4450]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar en la tienda por macetas, lámparas, soportes..."
                  className="w-full pl-10 pr-4 py-2 bg-[#FAF7F0] rounded-xl text-xs text-[#1C1C18] focus:outline-none focus:ring-2 focus:ring-[#6D3ACD]/30 border border-[#CDC3D2]/30 font-medium"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-[#350463] text-white shadow-xs'
                        : 'bg-[#F0EEE7] text-[#4B4450] hover:text-[#1C1C18]'
                    }`}
                  >
                    {cat === 'all' ? `Todos (${catalog.length})` : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {publishedProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-3xl p-4 shadow-xs hover:shadow-xl transition-all border border-[#CDC3D2]/40 flex flex-col justify-between group relative"
                >
                  <div>
                    {/* Image */}
                    <div
                      onClick={() => handleOpenProductDetail(product)}
                      className="w-full h-48 rounded-2xl overflow-hidden relative bg-[#FAF7F0] mb-3 border border-[#CDC3D2]/30 cursor-pointer"
                    >
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-[#350463]/85 backdrop-blur-xs text-[#C0F441] text-[10px] font-bold shadow-xs">
                        {product.category}
                      </span>
                    </div>

                    <h3
                      onClick={() => handleOpenProductDetail(product)}
                      className="text-sm font-extrabold text-[#350463] leading-snug group-hover:text-[#6D3ACD] transition-colors cursor-pointer line-clamp-1"
                    >
                      {product.title}
                    </h3>
                    <p className="text-xs text-[#4B4450] mt-1 line-clamp-2 leading-relaxed">
                      {product.subtitle}
                    </p>

                    {/* Dimensions & Material tags */}
                    <div className="flex flex-wrap items-center gap-1.5 my-2.5 text-[10px]">
                      {product.dimensions && (
                        <span className="px-2 py-0.5 rounded-md bg-[#FAF7F0] text-[#350463] font-mono font-bold border border-[#CDC3D2]/40">
                          📐 {product.dimensions}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md bg-[#FAF7F0] text-[#4B4450] font-bold border border-[#CDC3D2]/40">
                        🧶 {product.materials.join(', ')}
                      </span>
                    </div>
                  </div>

                  {/* Price and Add Button */}
                  <div className="pt-3 border-t border-[#F0EEE7] flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-[#4B4450] block font-semibold">Precio Taller</span>
                      <span className="text-lg font-black text-[#350463] font-mono">
                        ${product.suggestedPrice.toFixed(2)}{' '}
                        <span className="text-[10px] font-normal text-[#4B4450]">MXN</span>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddToCart(product, 1)}
                      className="px-3.5 py-2 rounded-xl bg-[#350463] hover:bg-[#6D3ACD] text-white font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-[#C0F441]" />
                      <span>+ Carrito</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECCIÓN 2: PORTAL DE COTIZACIÓN PERSONALIZADA (REQ 3 M3) */}
        {/* ======================================================== */}
        {activeStoreSection === 'custom_quote' && (
          <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-[#CDC3D2]/40 animate-in fade-in duration-300">
            <div className="text-center space-y-2 pb-6 border-b border-[#F0EEE7]">
              <span className="px-3 py-1 rounded-full bg-[#EADDFB] text-[#350463] text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#6D3ACD]" />
                Prototipado a Medida & Maquila 3D
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#350463]">
                Cotiza tu Archivo 3D Personalizado
              </h2>
              <p className="text-xs sm:text-sm text-[#4B4450] max-w-lg mx-auto">
                Sube tu modelo en .STL, .3MF o .STEP. Nuestro taller analizará volumen, tiempo de impresión en Bambu Lab y enviará tu cotización formal por WhatsApp/Correo en menos de 2 horas.
              </p>
            </div>

            {/* Success Notification */}
            {customQuoteSuccess && (
              <div className="my-6 p-4 rounded-2xl bg-[#C0F441]/20 border border-[#86B100] text-[#2E3F00] space-y-2 animate-in zoom-in-95">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-[#2E3F00] shrink-0" />
                  <h4 className="font-black text-sm">
                    ¡Solicitud #{customQuoteSuccess} Recibida con Éxito!
                  </h4>
                </div>
                <p className="text-xs text-[#2E3F00]/90 leading-relaxed">
                  El equipo de KiMO 3D Studio analizará tu archivo y enviará tu cotización formal por WhatsApp y correo electrónico en menos de 2 horas hábiles.
                </p>
                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomQuoteSuccess(null)}
                    className="px-4 py-1.5 rounded-xl bg-[#2E3F00] text-[#C0F441] text-xs font-bold"
                  >
                    Cotizar otra pieza
                  </button>
                </div>
              </div>
            )}

            {!customQuoteSuccess && (
              <form onSubmit={handleSubmitCustomQuote} className="space-y-6 pt-6 text-xs">
                {/* 1. Dropzone de Archivo 3D */}
                <div className="space-y-2">
                  <label className="font-bold text-[#1C1C18] block text-sm">
                    1. Carga tu Archivo 3D o Referencia (.STL, .3MF, .STEP, .OBJ)
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#6D3ACD]/40 hover:border-[#6D3ACD] rounded-2xl p-6 bg-[#FAF7F0] hover:bg-[#F3EEFA] transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-2"
                  >
                    <Upload className="w-8 h-8 text-[#6D3ACD] animate-bounce" />
                    {customFileName ? (
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#CDC3D2]/40 shadow-xs">
                        <FileCheck className="w-4 h-4 text-[#86B100]" />
                        <span className="font-bold text-[#350463]">{customFileName}</span>
                        <span className="font-mono text-[10px] text-[#4B4450]">({customFileSize})</span>
                      </div>
                    ) : (
                      <>
                        <span className="font-bold text-[#350463] text-xs">
                          Arrastra tu archivo 3D aquí o haz clic para explorar
                        </span>
                        <span className="text-[11px] text-[#4B4450]">
                          Formatos aceptados: STL, 3MF, STEP, OBJ, ZIP (Máx 50MB)
                        </span>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".stl,.3mf,.step,.stp,.obj,.zip"
                      onChange={handleCustomFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* 2. Selección de Material y Color */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-[#1C1C18] block mb-1">Material Sugerido</label>
                    <select
                      value={customMaterial}
                      onChange={(e) => setCustomMaterial(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/50 font-bold text-[#350463] text-xs focus:outline-none"
                    >
                      <option value="PLA+ Decorativo / Mate">PLA+ Decorativo / Mate (Figuras, maquetas, visual)</option>
                      <option value="PETG Resistente / Exterior">PETG Resistente (Uso mecánico, calor, exterior)</option>
                      <option value="TPU Flexible 95A">TPU Flexible 95A (Sellos, fundas, elástico)</option>
                      <option value="Resina Alta Definición SLA">Resina Alta Definición SLA (Joyería, miniaturas)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-[#1C1C18] block mb-1">Color Deseado</label>
                    <select
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/50 font-bold text-[#1C1C18] text-xs focus:outline-none"
                    >
                      <option value="Negro Ónix">Negro Ónix</option>
                      <option value="Blanco Puro">Blanco Puro</option>
                      <option value="Terracota">Terracota</option>
                      <option value="Lavanda Mate">Lavanda Mate</option>
                      <option value="Morado KiMO">Morado KiMO</option>
                      <option value="Gris Técnico">Gris Técnico</option>
                      <option value="Multicolor / Personalizado">Multicolor / Personalizado</option>
                    </select>
                  </div>
                </div>

                {/* 3. Cantidad e Instrucciones Especiales */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="font-bold text-[#1C1C18] block mb-1">Cantidad de Piezas</label>
                    <input
                      type="number"
                      min="1"
                      value={customQuantity}
                      onChange={(e) => setCustomQuantity(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/50 font-mono font-bold text-[#350463] text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-bold text-[#1C1C18] block mb-1">
                      Instrucciones Especiales / Dimensiones / Tolerancias
                    </label>
                    <input
                      type="text"
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      placeholder="ej. Medidas deseadas 12x8cm, relleno 40%, tornillería M4..."
                      className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/50 text-xs"
                    />
                  </div>
                </div>

                {/* 4. Datos de Contacto */}
                <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#CDC3D2]/40 space-y-3">
                  <span className="font-bold text-[#350463] uppercase tracking-wider block text-[11px]">
                    Datos de Contacto para Envío de Cotización
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-[#1C1C18] block mb-1">Nombre Completo</label>
                      <input
                        type="text"
                        value={customClientName}
                        onChange={(e) => setCustomClientName(e.target.value)}
                        required
                        placeholder="ej. Sofía Morales"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#CDC3D2]/50 text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-[#1C1C18] block mb-1">WhatsApp (Para enviar PDF)</label>
                      <input
                        type="tel"
                        value={customClientPhone}
                        onChange={(e) => setCustomClientPhone(e.target.value)}
                        required
                        placeholder="ej. 55 1234 5678"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#CDC3D2]/50 text-xs font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-[#1C1C18] block mb-1">Correo Electrónico</label>
                      <input
                        type="email"
                        value={customClientEmail}
                        onChange={(e) => setCustomClientEmail(e.target.value)}
                        placeholder="ej. sofia@empresa.com"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#CDC3D2]/50 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 px-6 rounded-2xl bg-[#350463] hover:bg-[#250247] text-[#C0F441] font-black text-sm shadow-md active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <SendIcon className="w-4 h-4" />
                    <span>🚀 Enviar Archivo para Cotización Formal (Respuesta &lt; 2h)</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* SECCIÓN 3: CONTACTO & TALLER CDMX (REQ 3)                */}
        {/* ======================================================== */}
        {activeStoreSection === 'contact' && (
          <div className="max-w-4xl mx-auto bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-[#CDC3D2]/40 animate-in fade-in duration-300 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <span className="px-3 py-1 rounded-full bg-[#EADDFB] text-[#350463] text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#6D3ACD]" />
                Taller & Centro de Operaciones
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#350463]">
                KiMO 3D Studio Roma Norte
              </h2>
              <p className="text-xs text-[#4B4450] leading-relaxed">
                Laboratorio de fabricación digital, granja de impresión Bambu Lab y centro de recolección de pedidos en Ciudad de México.
              </p>

              <div className="space-y-3 pt-2 text-xs">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#FAF7F0] border border-[#CDC3D2]/40">
                  <MapPin className="w-5 h-5 text-[#6D3ACD] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#1C1C18] block">Dirección de Recolección:</span>
                    <span className="text-[#4B4450]">Colima #145, Col. Roma Norte, Cuauhtémoc, 06700 Ciudad de México, CDMX.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#FAF7F0] border border-[#CDC3D2]/40">
                  <Clock className="w-5 h-5 text-[#6D3ACD] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#1C1C18] block">Horarios de Fabricación & Entrega:</span>
                    <span className="text-[#4B4450]">Lunes a Viernes: 09:00 - 19:00 hrs • Sábados: 10:00 - 14:00 hrs</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#FAF7F0] border border-[#CDC3D2]/40">
                  <MessageCircle className="w-5 h-5 text-[#2E3F00] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#1C1C18] block">Atención Directa por WhatsApp:</span>
                    <span className="text-[#4B4450] font-mono">+52 55 4890 2210 (Taller KiMO)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border border-[#CDC3D2]/40 bg-[#FAF7F0] relative min-h-[260px] flex items-center justify-center p-6 text-center">
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-[#350463] text-[#C0F441] mx-auto flex items-center justify-center font-bold text-xl shadow-md">
                  📍
                </div>
                <h4 className="font-black text-sm text-[#350463]">Hub CDMX Central</h4>
                <p className="text-xs text-[#4B4450] max-w-xs">
                  Recolección sin costo disponible al seleccionar "Recoger en Taller KiMO" durante tu checkout con Stripe.
                </p>
                <div className="pt-2">
                  <span className="px-3 py-1 rounded-full bg-[#C0F441] text-[#2E3F00] font-bold text-[10px]">
                    ● Impresoras Activas & Entregas Operando
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* 3. PRODUCT DETAIL DRAWER / MODAL (REQ 3 MÓDULO 1)        */}
      {/* ======================================================== */}
      {selectedProductForModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl border-l border-purple-100 flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-[#F0EEE7] flex items-center justify-between shrink-0 bg-white">
              <span className="px-2.5 py-0.5 rounded-full bg-[#EADDFB] text-[#350463] text-[10px] font-bold uppercase">
                {selectedProductForModal.category}
              </span>
              <button
                type="button"
                onClick={() => setSelectedProductForModal(null)}
                className="p-2 hover:bg-[#F0EEE7] rounded-xl text-[#4B4450] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">

            <div className="w-full h-56 rounded-2xl overflow-hidden my-4 bg-[#FAF7F0] border border-[#CDC3D2]/30">
              <img
                src={selectedProductForModal.imageUrl}
                alt={selectedProductForModal.title}
                className="w-full h-full object-cover"
              />
            </div>

            <h3 className="text-xl font-black text-[#350463]">{selectedProductForModal.title}</h3>
            <p className="text-xs text-[#4B4450] mt-1 leading-relaxed">
              {selectedProductForModal.description}
            </p>

            <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-[#FAF7F0] border border-[#CDC3D2]/40 my-4 text-xs">
              <div>
                <span className="text-[#4B4450] text-[10px] block">Materiales</span>
                <span className="font-bold text-[#1C1C18]">{selectedProductForModal.materials.join(', ')}</span>
              </div>
              <div>
                <span className="text-[#4B4450] text-[10px] block">Dimensiones</span>
                <span className="font-bold font-mono text-[#350463]">
                  {selectedProductForModal.dimensions || '15 x 15 cm'}
                </span>
              </div>
              <div>
                <span className="text-[#4B4450] text-[10px] block">Tiempo de Producción</span>
                <span className="font-bold text-[#1C1C18]">24 a 48 hrs hábiles</span>
              </div>
              <div>
                <span className="text-[#4B4450] text-[10px] block">Acabado</span>
                <span className="font-bold text-[#1C1C18]">Inspección & Desbarbado Manual</span>
              </div>
            </div>

            {/* Quantity and Color Selectors */}
            <div className="flex items-center justify-between gap-4 py-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#4B4450]">Cantidad:</span>
                <div className="flex items-center border border-[#CDC3D2] rounded-xl overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => setSelectedQty(Math.max(1, selectedQty - 1))}
                    className="p-1.5 hover:bg-[#FAF7F0] text-[#350463]"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 py-1 font-mono font-bold text-xs">{selectedQty}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedQty(selectedQty + 1)}
                    className="p-1.5 hover:bg-[#FAF7F0] text-[#350463]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-[#4B4450] block">Subtotal</span>
                <span className="text-xl font-black text-[#350463] font-mono">
                  ${(selectedProductForModal.suggestedPrice * selectedQty).toFixed(2)} MXN
                </span>
              </div>
            </div>
          </div>

          {/* Sticky Drawer Footer */}
          <div className="p-4 sm:p-5 border-t border-[#F0EEE7] bg-white shrink-0">
            <button
              type="button"
              onClick={() => handleAddToCart(selectedProductForModal, selectedQty, selectedColor, selectedMaterial)}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#C0F441] hover:bg-[#A5D721] text-[#2E3F00] font-black text-xs shadow-md active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Agregar al Carrito de Compras</span>
            </button>
          </div>
        </div>
      </div>
      )}

      {/* ======================================================== */}
      {/* 4. SHOPPING CART DRAWER (REQ 3 MÓDULO 2)                  */}
      {/* ======================================================== */}
      {isCartDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#F0EEE7]">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-2xl bg-[#350463] text-[#C0F441] flex items-center justify-center font-bold shadow-xs">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-[#350463]">Tu Carrito de Compra</h3>
                    <span className="text-[11px] text-[#4B4450]">{cartItemCount} artículos agregados</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="p-1.5 hover:bg-[#F0EEE7] rounded-xl text-[#4B4450]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Items List */}
              {cart.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-[#FAF7F0] border border-[#CDC3D2] mx-auto flex items-center justify-center text-2xl">
                    🛒
                  </div>
                  <p className="text-xs text-[#4B4450]">Tu carrito está vacío actualmente.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCartDrawerOpen(false);
                      setActiveStoreSection('catalog');
                    }}
                    className="px-4 py-2 rounded-xl bg-[#350463] text-white text-xs font-bold hover:bg-[#6D3ACD]"
                  >
                    Ver Catálogo
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[#F0EEE7] my-4 max-h-[50vh] overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="py-3 flex items-center gap-3 justify-between text-xs">
                      <img
                        src={item.recipe.imageUrl}
                        alt={item.recipe.title}
                        className="w-14 h-14 rounded-xl object-cover border border-[#CDC3D2]/40 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-[#350463] truncate">{item.recipe.title}</h4>
                        <span className="text-[10px] text-[#4B4450] block">
                          {item.selectedMaterial} • {item.selectedColor}
                        </span>
                        <span className="font-mono font-bold text-[#2E3F00]">
                          ${item.unitPrice.toFixed(2)} MXN
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQty(item.id, item.quantity - 1)}
                          className="w-6 h-6 rounded-lg bg-[#FAF7F0] border border-[#CDC3D2] flex items-center justify-center text-xs"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold text-xs w-5 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQty(item.id, item.quantity + 1)}
                          className="w-6 h-6 rounded-lg bg-[#FAF7F0] border border-[#CDC3D2] flex items-center justify-center text-xs"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQty(item.id, 0)}
                          className="p-1 text-[#BA1A1A] hover:bg-[#FFDAD6] rounded ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Summary & Checkout Trigger */}
            {cart.length > 0 && (
              <div className="pt-4 border-t border-[#F0EEE7] space-y-3">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#4B4450]">
                    <span>Subtotal</span>
                    <span className="font-mono font-bold text-[#1C1C18]">${cartSubtotal.toFixed(2)} MXN</span>
                  </div>
                  <div className="flex justify-between text-[#4B4450]">
                    <span>IVA Trasladado (16%)</span>
                    <span className="font-mono font-bold text-[#1C1C18]">${vatAmount.toFixed(2)} MXN</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-[#350463] pt-1 border-t border-[#F0EEE7]">
                    <span>Total Estimado</span>
                    <span className="font-mono text-base text-[#2E3F00]">${(cartSubtotal + vatAmount).toFixed(2)} MXN</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsCartDrawerOpen(false);
                    setIsCheckoutModalOpen(true);
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#350463] hover:bg-[#250247] text-[#C0F441] font-black text-xs shadow-md active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Proceder al Pago con Stripe</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. STRIPE CHECKOUT DRAWER (REQ 3 MÓDULO 2)                */}
      {/* ======================================================== */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl border-l border-purple-100 flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-[#F0EEE7] flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#635BFF] text-white flex items-center justify-center font-bold text-sm shadow-md">
                  stripe
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-[#350463]">
                    Checkout Seguro • KiMO 3D Studio
                  </h3>
                  <span className="text-[11px] text-[#4B4450] flex items-center gap-1">
                    <Lock className="w-3 h-3 text-[#86B100]" /> Conexión Encriptada SSL 256-bit
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutModalOpen(false)}
                className="p-2 hover:bg-[#F0EEE7] rounded-xl text-[#4B4450] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <form id="stripe-checkout-form" onSubmit={handleProcessStripePayment} className="space-y-4 text-xs">
              {/* 1. Datos de Contacto y Envío */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#CDC3D2]/40">
                <span className="font-bold text-[#350463] uppercase tracking-wider block text-[11px]">
                  1. Información de Envío & Cliente
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="font-bold text-[#1C1C18] block mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                      placeholder="ej. Mariana Treviño"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#CDC3D2]/50 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#1C1C18] block mb-1">Teléfono / WhatsApp</label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      required
                      placeholder="55 9876 5432"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#CDC3D2]/50 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-bold text-[#1C1C18] block mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      required
                      placeholder="mariana@empresa.com"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#CDC3D2]/50 text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#1C1C18] block mb-1">Método de Envío / Entrega</label>
                    <select
                      value={shippingMethod}
                      onChange={(e) => setShippingMethod(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#CDC3D2]/50 font-bold text-[#350463] text-xs"
                    >
                      <option value="uber_flash">⚡ Uber Flash Local CDMX ($85.00 MXN)</option>
                      <option value="paqueteria">📦 Paquetería Nacional Express ($140.00 MXN)</option>
                      <option value="counter">🏬 Recoger gratis en Taller KiMO CDMX ($0.00 MXN)</option>
                    </select>
                  </div>
                </div>

                {shippingMethod !== 'counter' && (
                  <div>
                    <label className="font-bold text-[#1C1C18] block mb-1">Dirección Completa de Entrega</label>
                    <input
                      type="text"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      required
                      placeholder="Calle, Número Exterior/Interior, Colonia, Alcaldía/Municipio, Código Postal"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#CDC3D2]/50 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* 2. Pasarela Stripe Card Elements */}
              <div className="space-y-3 p-4 rounded-2xl bg-gradient-to-br from-[#FAF7F0] to-[#EAE6F9] border border-[#635BFF]/30">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#350463] uppercase tracking-wider block text-[11px] flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-[#635BFF]" />
                    <span>2. Tarjeta de Crédito / Débito (Stripe Elements)</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-[#635BFF] font-black border border-[#635BFF]/20">
                      VISA
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-[#635BFF] font-black border border-[#635BFF]/20">
                      MC
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-[#635BFF] font-black border border-[#635BFF]/20">
                      AMEX
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="font-bold text-[#1C1C18] block mb-1">Número de Tarjeta</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4242 4242 4242 4242"
                        className="w-full px-3 py-2 pl-9 rounded-xl bg-white border border-[#CDC3D2]/50 text-xs font-mono font-bold text-[#1C1C18]"
                      />
                      <Lock className="w-3.5 h-3.5 text-[#4B4450] absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-[#1C1C18] block mb-1">Vencimiento (MM/YY)</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="12/28"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#CDC3D2]/50 text-xs font-mono text-center font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-[#1C1C18] block mb-1">CVC / CVV</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        placeholder="•••"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#CDC3D2]/50 text-xs font-mono text-center font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Desglose Total Transparente */}
              <div className="p-3 rounded-2xl bg-[#FAF7F0] border border-[#CDC3D2]/40 space-y-1 text-xs">
                <div className="flex justify-between text-[#4B4450]">
                  <span>Subtotal ({cartItemCount} piezas):</span>
                  <span className="font-mono font-bold text-[#1C1C18]">${cartSubtotal.toFixed(2)} MXN</span>
                </div>
                <div className="flex justify-between text-[#4B4450]">
                  <span>Costo de Envío:</span>
                  <span className="font-mono font-bold text-[#1C1C18]">
                    {shippingCost > 0 ? `$${shippingCost.toFixed(2)} MXN` : 'GRATIS'}
                  </span>
                </div>
                <div className="flex justify-between text-[#4B4450]">
                  <span>IVA Fiscal (16%):</span>
                  <span className="font-mono font-bold text-[#1C1C18]">${vatAmount.toFixed(2)} MXN</span>
                </div>
                <div className="flex justify-between text-base font-black text-[#350463] pt-2 border-t border-[#CDC3D2]/30">
                  <span>TOTAL A PAGAR:</span>
                  <span className="font-mono text-lg text-[#2E3F00]">${cartTotal.toFixed(2)} MXN</span>
                </div>
              </div>
            </form>
          </div>

          {/* Sticky Drawer Footer */}
          <div className="p-4 sm:p-5 border-t border-[#F0EEE7] bg-white shrink-0">
            <button
              type="submit"
              form="stripe-checkout-form"
              disabled={isProcessingPayment}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#635BFF] hover:bg-[#5851EA] text-white font-black text-sm shadow-md active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessingPayment ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Procesando pago con Stripe...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-[#C0F441]" />
                  <span>Pagar ${cartTotal.toFixed(2)} MXN con Stripe</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      )}

      {/* ======================================================== */}
      {/* 6. ORDER SUCCESS RECEIPT DRAWER                          */}
      {/* ======================================================== */}
      {orderSuccessReceipt && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md h-full shadow-2xl border-l border-purple-100 flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-[#F0EEE7] flex items-center justify-between shrink-0 bg-white">
              <span className="text-xs font-bold text-[#2E3F00] flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-[#86B100]" /> Comprobante Digital
              </span>
              <button
                type="button"
                onClick={() => {
                  setOrderSuccessReceipt(null);
                  setActiveStoreSection('catalog');
                }}
                className="p-2 hover:bg-[#F0EEE7] rounded-xl text-[#4B4450] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#C0F441] text-[#2E3F00] flex items-center justify-center mx-auto text-3xl font-black shadow-lg">
                ✓
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#86B100]">
                  Pago Exitoso Vía Stripe
                </span>
                <h3 className="text-2xl font-black text-[#350463]">¡Gracias por tu compra!</h3>
                <p className="text-xs text-[#4B4450]">
                  Tu pedido ha sido confirmado e ingresó directamente a la cola de producción en el taller.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#CDC3D2]/40 text-left text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#4B4450]">Folio de Pedido:</span>
                  <span className="font-mono font-bold text-[#350463]">{orderSuccessReceipt.folio}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4B4450]">Estatus de Producción:</span>
                  <span className="font-bold text-[#2E3F00]">🌐 En Cola (Stripe Pagado)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4B4450]">Monto Pagado:</span>
                  <span className="font-mono font-black text-[#1C1C18]">
                    ${orderSuccessReceipt.total.toFixed(2)} MXN
                  </span>
                </div>
              </div>
            </div>

            {/* Sticky Drawer Footer */}
            <div className="p-4 sm:p-5 border-t border-[#F0EEE7] bg-white shrink-0">
              <button
                type="button"
                onClick={() => {
                  setOrderSuccessReceipt(null);
                  setActiveStoreSection('catalog');
                }}
                className="w-full py-3.5 rounded-xl bg-[#350463] text-white font-bold text-xs hover:bg-[#6D3ACD] transition-colors cursor-pointer"
              >
                Seguir Comprando
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function SendIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}
