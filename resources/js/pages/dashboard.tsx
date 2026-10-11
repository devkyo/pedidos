import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    LayoutDashboard,
    Package,
    Sparkles,
    ShoppingBag,
    DollarSign,
    Plus,
    Edit2,
    Trash2,
    Download,
    CheckCircle2,
    Clock,
    XCircle,
    Truck,
    ExternalLink,
    Store,
    Phone,
    User,
    Check,
    X,
    AlertCircle,
    Calendar,
    Search,
    RefreshCw,
    Settings,
    Save,
    MessageSquare,
    ChevronLeft,
    ChevronRight,
    Eye,
    MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';

interface PackItem {
    id: number;
    nombre: string;
    precio: number | string;
    cantidad_marcianos: number;
    cantidad_regalo: number;
    activo: boolean;
}

interface SaborItem {
    id: number;
    nombre: string;
    descripcion: string | null;
    imagen: string | null;
    imagen_url: string | null;
    es_premium: boolean;
    precio_adicional: number | string;
    stock_activo: boolean;
}

interface ZonaEnvioItem {
    id: number;
    nombre: string;
    precio: number | string;
    tiempo_estimado: string | null;
    activo: boolean;
}

interface PedidoDetalle {
    id: number;
    cantidad: number;
    es_regalo: boolean;
    costo_extra_unitario: number | string;
    sabor?: {
        nombre: string;
        es_premium: boolean;
    };
    pack?: {
        nombre: string;
    };
}

interface PedidoItem {
    id: number;
    codigo_orden: string;
    cliente_nombre: string;
    cliente_telefono: string;
    telefono_respaldo: string | null;
    tipo_entrega: string;
    direccion_entrega?: string | null;
    zona_envio?: string | null;
    costo_envio?: number | string | null;
    notas?: string | null;
    total: number | string;
    fecha_pedido: string;
    estado: 'pendiente' | 'confirmado' | 'entregado' | 'cancelado';
    detalles: PedidoDetalle[];
}

interface DashboardProps {
    packs: PackItem[];
    sabores: SaborItem[];
    pedidos: {
        data: PedidoItem[];
        total: number;
        current_page: number;
        last_page: number;
        from?: number | null;
        to?: number | null;
        per_page?: number;
        links: {
            url: string | null;
            label: string;
            active: boolean;
        }[];
    };
    stats: {
        total_ventas: number;
        pedidos_totales: number;
        pedidos_pendientes: number;
        pedidos_entregados: number;
        packs_activos: number;
        sabores_activos: number;
    };
    filters: {
        desde: string | null;
        hasta: string | null;
        estado: string | null;
        search?: string | null;
    };
    whatsappPhone: string;
    whatsappMessage?: string;
    zonasEnvio?: ZonaEnvioItem[];
}

export default function Dashboard({
    packs = [],
    sabores = [],
    pedidos = { data: [], total: 0, current_page: 1, last_page: 1, links: [] },
    stats = {
        total_ventas: 0,
        pedidos_totales: 0,
        pedidos_pendientes: 0,
        pedidos_entregados: 0,
        packs_activos: 0,
        sabores_activos: 0,
    },
    filters = { desde: null, hasta: null, estado: null, search: null },
    whatsappPhone = '51987654321',
    whatsappMessage = '',
    zonasEnvio = [],
}: DashboardProps) {
    const [activeTab, setActiveTab] = useState<'pedidos' | 'packs' | 'sabores' | 'zonas' | 'configuracion'>('pedidos');

    // Pedido detail modal state
    const [viewingPedido, setViewingPedido] = useState<PedidoItem | null>(null);

    // Zona Modal Form State
    const [zonaModalOpen, setZonaModalOpen] = useState(false);
    const [editingZona, setEditingZona] = useState<ZonaEnvioItem | null>(null);
    const [zonaForm, setZonaForm] = useState({
        nombre: '',
        precio: '8.00',
        tiempo_estimado: '30-45 min',
        activo: true,
    });

    const openCreateZona = () => {
        setEditingZona(null);
        setZonaForm({
            nombre: '',
            precio: '8.00',
            tiempo_estimado: '30-45 min',
            activo: true,
        });
        setZonaModalOpen(true);
    };

    const openEditZona = (zona: ZonaEnvioItem) => {
        setEditingZona(zona);
        setZonaForm({
            nombre: zona.nombre,
            precio: String(zona.precio),
            tiempo_estimado: zona.tiempo_estimado || '',
            activo: zona.activo,
        });
        setZonaModalOpen(true);
    };

    const handleSaveZona = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingZona) {
            router.put(`/admin/zonas-envio/${editingZona.id}`, zonaForm, {
                onSuccess: () => setZonaModalOpen(false),
            });
        } else {
            router.post('/admin/zonas-envio', zonaForm, {
                onSuccess: () => setZonaModalOpen(false),
            });
        }
    };

    const handleDeleteZona = (zona: ZonaEnvioItem) => {
        if (confirm(`¿Estás seguro de eliminar la zona de envío "${zona.nombre}"?`)) {
            router.delete(`/admin/zonas-envio/${zona.id}`);
        }
    };

    // Settings state
    const [storeWhatsappPhone, setStoreWhatsappPhone] = useState(whatsappPhone);
    const [storeWhatsappMessage, setStoreWhatsappMessage] = useState(whatsappMessage || '');
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [settingsSaveSuccess, setSettingsSaveSuccess] = useState(false);
    const [settingsError, setSettingsError] = useState<string | null>(null);

    useEffect(() => {
        setStoreWhatsappPhone(whatsappPhone || '');
    }, [whatsappPhone]);

    useEffect(() => {
        setStoreWhatsappMessage(whatsappMessage || '');
    }, [whatsappMessage]);

    const handleSaveSettings = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingSettings(true);
        setSettingsSaveSuccess(false);
        setSettingsError(null);

        router.put('/admin/configuracion', {
            whatsapp_phone: storeWhatsappPhone,
            whatsapp_message: storeWhatsappMessage,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSavingSettings(false);
                setSettingsSaveSuccess(true);
                setTimeout(() => setSettingsSaveSuccess(false), 5000);
            },
            onError: (errs) => {
                setIsSavingSettings(false);
                const firstErr = Object.values(errs)[0];
                setSettingsError(typeof firstErr === 'string' ? firstErr : 'Error al guardar la configuración.');
            },
        });
    };

    // Search, date and status filters for Pedidos
    const [filterSearch, setFilterSearch] = useState(filters.search || '');
    const [filterDesde, setFilterDesde] = useState(filters.desde || '');
    const [filterHasta, setFilterHasta] = useState(filters.hasta || '');
    const [filterEstado, setFilterEstado] = useState(filters.estado || '');

    // Keep filter states in sync with props
    useEffect(() => {
        setFilterSearch(filters.search || '');
        setFilterDesde(filters.desde || '');
        setFilterHasta(filters.hasta || '');
        setFilterEstado(filters.estado || '');
    }, [filters]);

    // Filter submit handler
    const applyFilters = () => {
        router.get(
            '/dashboard',
            {
                search: filterSearch.trim() || undefined,
                desde: filterDesde || undefined,
                hasta: filterHasta || undefined,
                estado: filterEstado || undefined,
            },
            { preserveState: true }
        );
    };

    const resetFilters = () => {
        setFilterSearch('');
        setFilterDesde('');
        setFilterHasta('');
        setFilterEstado('');
        router.get('/dashboard', {}, { preserveState: true });
    };

    // Pack Modal Form State
    const [packModalOpen, setPackModalOpen] = useState(false);
    const [editingPack, setEditingPack] = useState<PackItem | null>(null);
    const [packForm, setPackForm] = useState({
        nombre: '',
        precio: '',
        cantidad_marcianos: '7',
        cantidad_regalo: '1',
        activo: true,
    });

    // Sabor Modal Form State
    const [saborModalOpen, setSaborModalOpen] = useState(false);
    const [editingSabor, setEditingSabor] = useState<SaborItem | null>(null);
    const [saborForm, setSaborForm] = useState({
        nombre: '',
        descripcion: '',
        imagen_url_input: '',
        es_premium: false,
        precio_adicional: '1.50',
        stock_activo: true,
    });
    const [saborFile, setSaborFile] = useState<File | null>(null);

    // Pack Modal Handlers
    const openCreatePack = () => {
        setEditingPack(null);
        setPackForm({
            nombre: '',
            precio: '29.00',
            cantidad_marcianos: '7',
            cantidad_regalo: '1',
            activo: true,
        });
        setPackModalOpen(true);
    };

    const openEditPack = (pack: PackItem) => {
        setEditingPack(pack);
        setPackForm({
            nombre: pack.nombre,
            precio: String(pack.precio),
            cantidad_marcianos: String(pack.cantidad_marcianos),
            cantidad_regalo: String(pack.cantidad_regalo),
            activo: pack.activo,
        });
        setPackModalOpen(true);
    };

    const handleSavePack = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingPack) {
            router.put(`/admin/packs/${editingPack.id}`, packForm, {
                onSuccess: () => setPackModalOpen(false),
            });
        } else {
            router.post('/admin/packs', packForm, {
                onSuccess: () => setPackModalOpen(false),
            });
        }
    };

    const handleDeletePack = (pack: PackItem) => {
        if (confirm(`¿Estás seguro de eliminar el "${pack.nombre}"?`)) {
            router.delete(`/admin/packs/${pack.id}`);
        }
    };

    // Sabor Modal Handlers
    const openCreateSabor = () => {
        setEditingSabor(null);
        setSaborFile(null);
        setSaborForm({
            nombre: '',
            descripcion: '',
            imagen_url_input: '',
            es_premium: false,
            precio_adicional: '1.50',
            stock_activo: true,
        });
        setSaborModalOpen(true);
    };

    const openEditSabor = (sabor: SaborItem) => {
        setEditingSabor(sabor);
        setSaborFile(null);
        setSaborForm({
            nombre: sabor.nombre,
            descripcion: sabor.descripcion || '',
            imagen_url_input: sabor.imagen || '',
            es_premium: sabor.es_premium,
            precio_adicional: String(sabor.precio_adicional || '0.00'),
            stock_activo: sabor.stock_activo,
        });
        setSaborModalOpen(true);
    };

    const handleSaveSabor = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('nombre', saborForm.nombre);
        formData.append('descripcion', saborForm.descripcion);
        formData.append('imagen_url_input', saborForm.imagen_url_input);
        formData.append('es_premium', saborForm.es_premium ? '1' : '0');
        formData.append('precio_adicional', saborForm.es_premium ? saborForm.precio_adicional : '0.00');
        formData.append('stock_activo', saborForm.stock_activo ? '1' : '0');

        if (saborFile) {
            formData.append('imagen_file', saborFile);
        }

        if (editingSabor) {
            router.post(`/admin/sabores/${editingSabor.id}`, formData, {
                onSuccess: () => setSaborModalOpen(false),
            });
        } else {
            router.post('/admin/sabores', formData, {
                onSuccess: () => setSaborModalOpen(false),
            });
        }
    };

    const handleDeleteSabor = (sabor: SaborItem) => {
        if (confirm(`¿Estás seguro de eliminar el sabor "${sabor.nombre}"?`)) {
            router.delete(`/admin/sabores/${sabor.id}`);
        }
    };

    // Pedido Status Handler
    const handleUpdateEstado = (pedidoId: number, nuevoEstado: string) => {
        router.patch(`/admin/pedidos/${pedidoId}/estado`, { estado: nuevoEstado });
    };

    // Pedido Delete Confirmation State & Handler
    const [deletingPedido, setDeletingPedido] = useState<PedidoItem | null>(null);
    const [isDeletingPedido, setIsDeletingPedido] = useState(false);

    const confirmDeletePedido = () => {
        if (!deletingPedido) return;

        setIsDeletingPedido(true);
        router.delete(`/admin/pedidos/${deletingPedido.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingPedido(null);
                setIsDeletingPedido(false);
            },
            onError: () => {
                setIsDeletingPedido(false);
            },
        });
    };

    return (
        <div className="min-h-screen bg-stone-50 text-slate-800 p-4 sm:p-6 lg:p-8">
            <Head title="Panel de Administración | Loreanne" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* HEADER CON BOTÓN A LA TIENDA */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-sm">
                    <div className="flex items-center gap-3">
                        <img
                            src="/images/logo.png"
                            alt="Loreanne"
                            className="w-12 h-12 rounded-full border border-stone-200 object-cover shadow-sm bg-white"
                        />
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-black text-stone-900 tracking-tight">
                                    Loreanne • Panel de Administración
                                </h1>
                            </div>
                            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                                Administra los packs, sabores, pedidos, zonas de envío y configuración de WhatsApp.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <a
                            href="/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-50 text-[#6D3B18] border border-amber-200 hover:bg-amber-100 rounded-xl font-bold text-xs transition-colors"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Ver Tienda en Vivo</span>
                        </a>
                    </div>
                </div>

                {/* STATS OVERVIEW CARDS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center shrink-0">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
                                Ventas Totales
                            </span>
                            <span className="text-xl sm:text-2xl font-black text-stone-900">
                                S/ {Number(stats.total_ventas).toFixed(2)}
                            </span>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center shrink-0">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
                                Pedidos Totales
                            </span>
                            <span className="text-xl sm:text-2xl font-black text-stone-900">
                                {stats.pedidos_totales}
                            </span>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center shrink-0">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
                                Pendientes
                            </span>
                            <span className="text-xl sm:text-2xl font-black text-amber-700">
                                {stats.pedidos_pendientes}
                            </span>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#6D3B18]/10 text-[#6D3B18] rounded-xl flex items-center justify-center shrink-0">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
                                Sabores / Packs
                            </span>
                            <span className="text-xl sm:text-2xl font-black text-stone-900">
                                {stats.sabores_activos} / {stats.packs_activos}
                            </span>
                        </div>
                    </div>
                </div>

                {/* TABS SELECTOR */}
                <div className="flex border-b border-stone-200 bg-white px-4 rounded-2xl shadow-sm gap-2">
                    <button
                        onClick={() => setActiveTab('pedidos')}
                        className={`flex items-center gap-2 py-4 px-4 font-bold text-sm border-b-2 transition-colors ${
                            activeTab === 'pedidos'
                                ? 'border-[#6D3B18] text-[#6D3B18]'
                                : 'border-transparent text-stone-500 hover:text-stone-800'
                        }`}
                    >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Gestión de Pedidos ({pedidos.total})</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('packs')}
                        className={`flex items-center gap-2 py-4 px-4 font-bold text-sm border-b-2 transition-colors ${
                            activeTab === 'packs'
                                ? 'border-[#6D3B18] text-[#6D3B18]'
                                : 'border-transparent text-stone-500 hover:text-stone-800'
                        }`}
                    >
                        <Package className="w-4 h-4" />
                        <span>Configurar Packs ({packs.length})</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('sabores')}
                        className={`flex items-center gap-2 py-4 px-4 font-bold text-sm border-b-2 transition-colors ${
                            activeTab === 'sabores'
                                ? 'border-[#6D3B18] text-[#6D3B18]'
                                : 'border-transparent text-stone-500 hover:text-stone-800'
                        }`}
                    >
                        <Sparkles className="w-4 h-4" />
                        <span>Catálogo de Sabores ({sabores.length})</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('zonas')}
                        className={`flex items-center gap-2 py-4 px-4 font-bold text-sm border-b-2 transition-colors ${
                            activeTab === 'zonas'
                                ? 'border-[#6D3B18] text-[#6D3B18]'
                                : 'border-transparent text-stone-500 hover:text-stone-800'
                        }`}
                    >
                        <Truck className="w-4 h-4" />
                        <span>Zonas de Envío ({zonasEnvio.length})</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('configuracion')}
                        className={`flex items-center gap-2 py-4 px-4 font-bold text-sm border-b-2 transition-colors ${
                            activeTab === 'configuracion'
                                ? 'border-[#6D3B18] text-[#6D3B18]'
                                : 'border-transparent text-stone-500 hover:text-stone-800'
                        }`}
                    >
                        <Settings className="w-4 h-4" />
                        <span>Configuración de Tienda</span>
                    </button>
                </div>

                {/* TAB CONTENT: PEDIDOS */}
                {activeTab === 'pedidos' && (
                    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-6">
                        {/* Filters & Export Bar */}
                        <div className="flex flex-col gap-3.5 bg-stone-50 p-4 rounded-xl border border-stone-200/80">
                            {/* Search by Code / Customer */}
                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                                    <Search className="w-3.5 h-3.5 text-stone-500" />
                                    <span>Buscar por Código de Pedido, Cliente o Teléfono</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Ej: ORD-ABC12, María, 987654321..."
                                        value={filterSearch}
                                        onChange={(e) => setFilterSearch(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                applyFilters();
                                            }
                                        }}
                                        className="w-full text-xs rounded-lg border-stone-300 pl-9 pr-8 py-2 bg-white focus:ring-stone-500 focus:border-stone-500 shadow-xs"
                                    />
                                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    {filterSearch && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFilterSearch('');
                                                router.get(
                                                    '/dashboard',
                                                    {
                                                        desde: filterDesde || undefined,
                                                        hasta: filterHasta || undefined,
                                                        estado: filterEstado || undefined,
                                                    },
                                                    { preserveState: true }
                                                );
                                            }}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Additional Date & Status filters */}
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pt-2 border-t border-stone-200/60">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                                    <div>
                                        <label className="block text-[11px] font-bold text-stone-600 mb-1">
                                            Fecha Desde
                                        </label>
                                        <input
                                            type="date"
                                            value={filterDesde}
                                            onChange={(e) => setFilterDesde(e.target.value)}
                                            className="w-full text-xs rounded-lg border-stone-300 py-1.5 px-2 bg-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-stone-600 mb-1">
                                            Fecha Hasta
                                        </label>
                                        <input
                                            type="date"
                                            value={filterHasta}
                                            onChange={(e) => setFilterHasta(e.target.value)}
                                            className="w-full text-xs rounded-lg border-stone-300 py-1.5 px-2 bg-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-stone-600 mb-1">
                                            Estado
                                        </label>
                                        <select
                                            value={filterEstado}
                                            onChange={(e) => setFilterEstado(e.target.value)}
                                            className="w-full text-xs rounded-lg border-stone-300 py-1.5 px-2 bg-white"
                                        >
                                            <option value="">Todos los Estados</option>
                                            <option value="pendiente">Pendiente</option>
                                            <option value="confirmado">Confirmado</option>
                                            <option value="entregado">Entregado</option>
                                            <option value="cancelado">Cancelado</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                    <button
                                        onClick={applyFilters}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-800 text-white rounded-lg text-xs font-bold hover:bg-stone-900 transition-colors shadow-xs"
                                    >
                                        <Search className="w-3.5 h-3.5" />
                                        <span>Buscar / Filtrar</span>
                                    </button>

                                    <button
                                        onClick={resetFilters}
                                        className="px-3.5 py-2 bg-stone-200 text-stone-700 rounded-lg text-xs font-bold hover:bg-stone-300 transition-colors"
                                    >
                                        Limpiar
                                    </button>

                                    <a
                                        href={`/admin/pedidos/export?desde=${filterDesde}&hasta=${filterHasta}&estado=${filterEstado}&search=${encodeURIComponent(filterSearch)}`}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        <span>Descargar Excel</span>
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Pedidos Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-stone-100 text-stone-700 text-xs uppercase tracking-wider font-bold border-b border-stone-200">
                                    <tr>
                                        <th className="py-3 px-4">Código / Fecha</th>
                                        <th className="py-3 px-4">Cliente</th>
                                        <th className="py-3 px-4">Entrega</th>
                                        <th className="py-3 px-4">Sabores Elegidos</th>
                                        <th className="py-3 px-4">Total</th>
                                        <th className="py-3 px-4">Estado</th>
                                        <th className="py-3 px-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {pedidos.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-8 text-center text-stone-400">
                                                No se encontraron pedidos con los filtros actuales.
                                            </td>
                                        </tr>
                                    ) : (
                                        pedidos.data.map((ped) => {
                                            const fechaFormatted = ped.fecha_pedido
                                                ? new Date(ped.fecha_pedido).toLocaleString('es-PE', {
                                                      dateStyle: 'short',
                                                      timeStyle: 'short',
                                                  })
                                                : '-';

                                            return (
                                                <tr key={ped.id} className="hover:bg-stone-50/70 transition-colors">
                                                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#6D3B18]">
                                                        {ped.codigo_orden}
                                                        <span className="block font-sans text-[11px] font-normal text-stone-400 mt-0.5">
                                                            {fechaFormatted}
                                                        </span>
                                                    </td>

                                                    <td className="py-3.5 px-4">
                                                        <div className="font-bold text-stone-900 text-xs">
                                                            {ped.cliente_nombre}
                                                        </div>
                                                        <a
                                                            href={`https://wa.me/51${ped.cliente_telefono.replace(/\D/g, '')}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-[11px] text-emerald-600 hover:underline inline-flex items-center gap-1 font-semibold"
                                                        >
                                                            <Phone className="w-2.5 h-2.5" />
                                                            {ped.cliente_telefono}
                                                        </a>
                                                    </td>

                                                    <td className="py-3.5 px-4">
                                                        <span
                                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                                ped.tipo_entrega === 'delivery'
                                                                    ? 'bg-blue-50 text-blue-700'
                                                                    : 'bg-amber-50 text-amber-800'
                                                            }`}
                                                        >
                                                            {ped.tipo_entrega === 'delivery' ? (
                                                                <Truck className="w-3 h-3" />
                                                            ) : (
                                                                <Store className="w-3 h-3" />
                                                            )}
                                                            <span className="capitalize">{ped.tipo_entrega}</span>
                                                        </span>
                                                    </td>

                                                    <td className="py-3.5 px-4 max-w-xs">
                                                        <div className="text-xs space-y-0.5">
                                                            {ped.detalles.map((det) => (
                                                                <div
                                                                    key={det.id}
                                                                    className="text-stone-600 flex items-center justify-between gap-2"
                                                                >
                                                                    <span>
                                                                        • {det.cantidad}x {det.sabor?.nombre}
                                                                    </span>
                                                                    {det.es_regalo && (
                                                                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1 rounded font-bold">
                                                                            Regalo
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>

                                                    <td className="py-3.5 px-4 font-black text-stone-900">
                                                        S/ {Number(ped.total).toFixed(2)}
                                                    </td>

                                                    <td className="py-3.5 px-4">
                                                        <select
                                                            value={ped.estado}
                                                            onChange={(e) =>
                                                                handleUpdateEstado(ped.id, e.target.value)
                                                            }
                                                            className={`text-xs font-bold rounded-lg px-2.5 py-1 border transition-colors ${
                                                                ped.estado === 'pendiente'
                                                                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                                                                    : ped.estado === 'confirmado'
                                                                    ? 'bg-blue-50 text-blue-800 border-blue-300'
                                                                    : ped.estado === 'entregado'
                                                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                                                    : 'bg-red-50 text-red-800 border-red-300'
                                                            }`}
                                                        >
                                                            <option value="pendiente">Pendiente</option>
                                                            <option value="confirmado">Confirmado</option>
                                                            <option value="entregado">Entregado</option>
                                                            <option value="cancelado">Cancelado</option>
                                                        </select>
                                                    </td>

                                                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                        <button
                                                            onClick={() => setViewingPedido(ped)}
                                                            className="p-1.5 text-stone-400 hover:text-[#6D3B18] hover:bg-amber-50 rounded-lg text-xs font-semibold transition-colors"
                                                            title={`Ver detalle del pedido ${ped.codigo_orden}`}
                                                            aria-label={`Ver detalle del pedido ${ped.codigo_orden}`}
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeletingPedido(ped)}
                                                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition-colors"
                                                            title={`Eliminar pedido ${ped.codigo_orden}`}
                                                            aria-label={`Eliminar pedido ${ped.codigo_orden}`}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls Footer (30 pedidos per page) */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-stone-200 text-xs text-stone-600">
                            <div>
                                {pedidos.total > 0 ? (
                                    <span>
                                        Mostrando <strong className="text-stone-900 font-bold">{pedidos.from ?? 1}</strong> a{' '}
                                        <strong className="text-stone-900 font-bold">{pedidos.to ?? pedidos.data.length}</strong> de{' '}
                                        <strong className="text-stone-900 font-bold">{pedidos.total}</strong> pedidos (30 por página)
                                    </span>
                                ) : (
                                    <span>0 pedidos encontrados</span>
                                )}
                            </div>

                            {pedidos.last_page > 1 && (
                                <div className="flex items-center gap-1">
                                    {pedidos.links.map((link, idx) => {
                                        const isPrev = link.label.includes('&laquo;') || link.label.toLowerCase().includes('previous') || link.label.toLowerCase().includes('anterior');
                                        const isNext = link.label.includes('&raquo;') || link.label.toLowerCase().includes('next') || link.label.toLowerCase().includes('siguiente');

                                        const labelContent = isPrev ? (
                                            <span className="flex items-center gap-1">
                                                <ChevronLeft className="w-3.5 h-3.5" />
                                                <span className="hidden sm:inline">Anterior</span>
                                            </span>
                                        ) : isNext ? (
                                            <span className="flex items-center gap-1">
                                                <span className="hidden sm:inline">Siguiente</span>
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            </span>
                                        ) : (
                                            link.label
                                        );

                                        if (!link.url) {
                                            return (
                                                <span
                                                    key={`page-disabled-${idx}`}
                                                    className="px-2.5 py-1.5 rounded-lg text-stone-400 bg-stone-100 cursor-not-allowed text-xs font-semibold"
                                                >
                                                    {labelContent}
                                                </span>
                                            );
                                        }

                                        return (
                                            <button
                                                key={`page-${idx}`}
                                                onClick={() => router.get(link.url!, {}, { preserveState: true })}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                                    link.active
                                                        ? 'bg-[#6D3B18] text-white shadow-xs'
                                                        : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                                                }`}
                                            >
                                                {labelContent}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB CONTENT: PACKS */}
                {activeTab === 'packs' && (
                    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-stone-900">
                                    Packs de Marcianos Predefinidos
                                </h3>
                                <p className="text-xs text-stone-500">
                                    Define la cantidad de unidades, precio y marcianos gratis de regalo.
                                </p>
                            </div>

                            <button
                                onClick={openCreatePack}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#6D3B18] text-white rounded-xl text-xs font-bold hover:bg-[#572e12] transition-colors shadow-sm"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Nuevo Pack</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {packs.map((pack) => (
                                <div
                                    key={pack.id}
                                    className={`p-5 rounded-2xl border-2 flex flex-col justify-between transition-all ${
                                        pack.activo
                                            ? 'border-stone-200 bg-white hover:border-amber-400'
                                            : 'border-stone-200 bg-stone-50 opacity-60'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="font-bold text-base text-stone-900">
                                                {pack.nombre}
                                            </h4>
                                            <span
                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                    pack.activo
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : 'bg-stone-200 text-stone-600'
                                                }`}
                                            >
                                                {pack.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </div>

                                        <div className="mt-3 space-y-1.5 text-xs text-stone-600">
                                            <div className="flex justify-between">
                                                <span>Cantidad Marcianos:</span>
                                                <strong className="text-stone-900">
                                                    {pack.cantidad_marcianos}
                                                </strong>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Marcianos de Regalo:</span>
                                                <strong className="text-emerald-700">
                                                    +{pack.cantidad_regalo} gratis
                                                </strong>
                                            </div>
                                            <div className="flex justify-between pt-2 border-t border-stone-100">
                                                <span className="font-bold text-stone-700">Precio:</span>
                                                <strong className="text-base font-black text-[#6D3B18]">
                                                    S/ {Number(pack.precio).toFixed(2)}
                                                </strong>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => openEditPack(pack)}
                                            className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg text-xs font-semibold"
                                            title="Editar Pack"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>

                                        <button
                                            onClick={() => handleDeletePack(pack)}
                                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg text-xs font-semibold"
                                            title="Eliminar Pack"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB CONTENT: SABORES */}
                {activeTab === 'sabores' && (
                    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-stone-900">
                                    Catálogo de Sabores Artesanales
                                </h3>
                                <p className="text-xs text-stone-500">
                                    Controla nombres, fotos, recargos premium y disponibilidad de stock.
                                </p>
                            </div>

                            <button
                                onClick={openCreateSabor}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#6D3B18] text-white rounded-xl text-xs font-bold hover:bg-[#572e12] transition-colors shadow-sm"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Nuevo Sabor</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {sabores.map((sabor) => {
                                const imgUrl =
                                    sabor.imagen_url ||
                                    sabor.imagen ||
                                    'https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?auto=format&fit=crop&w=300&q=80';

                                return (
                                    <div
                                        key={sabor.id}
                                        className={`rounded-2xl border p-4 flex flex-col justify-between transition-all ${
                                            sabor.stock_activo
                                                ? 'border-stone-200 bg-white hover:border-amber-400'
                                                : 'border-stone-200 bg-stone-50 opacity-60'
                                        }`}
                                    >
                                        <div>
                                            <div className="relative w-full h-32 rounded-xl overflow-hidden bg-stone-100 mb-3 border border-stone-100">
                                                <img
                                                    src={imgUrl}
                                                    alt={sabor.nombre}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src =
                                                            'https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?auto=format&fit=crop&w=300&q=80';
                                                    }}
                                                />
                                                {sabor.es_premium && (
                                                    <span className="absolute top-2 right-2 bg-amber-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full shadow-sm">
                                                        ★ PREMIUM
                                                    </span>
                                                )}
                                            </div>

                                            <h4 className="font-bold text-stone-900 text-sm leading-tight">
                                                {sabor.nombre}
                                            </h4>

                                            {sabor.descripcion && (
                                                <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                                                    {sabor.descripcion}
                                                </p>
                                            )}

                                            <div className="mt-3 flex items-center justify-between text-xs">
                                                <span
                                                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                                        sabor.stock_activo
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}
                                                >
                                                    {sabor.stock_activo ? 'En Stock' : 'Agotado'}
                                                </span>

                                                {sabor.es_premium ? (
                                                    <span className="font-black text-amber-700">
                                                        +S/ {Number(sabor.precio_adicional).toFixed(2)}
                                                    </span>
                                                ) : (
                                                    <span className="text-stone-400 font-medium">Clásico</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openEditSabor(sabor)}
                                                className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg text-xs"
                                                title="Editar Sabor"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>

                                            <button
                                                onClick={() => handleDeleteSabor(sabor)}
                                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg text-xs"
                                                title="Eliminar Sabor"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* TAB CONTENT: ZONAS DE ENVIO */}
                {activeTab === 'zonas' && (
                    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-stone-900">
                                    Tarifas & Zonas de Delivery ({zonasEnvio.length})
                                </h3>
                                <p className="text-xs text-stone-500">
                                    Configura los distritos de cobertura, precios de envío y tiempos estimados calculados en la tienda.
                                </p>
                            </div>

                            <button
                                onClick={openCreateZona}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#6D3B18] text-white rounded-xl text-xs font-bold hover:bg-[#572e12] transition-colors shadow-sm self-start sm:self-auto"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Nueva Zona de Envío</span>
                            </button>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-stone-100 text-stone-700 text-xs uppercase tracking-wider font-bold border-b border-stone-200">
                                    <tr>
                                        <th className="py-3 px-4">Distrito / Zona</th>
                                        <th className="py-3 px-4">Costo de Envío</th>
                                        <th className="py-3 px-4">Tiempo Estimado</th>
                                        <th className="py-3 px-4">Estado</th>
                                        <th className="py-3 px-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100 text-xs">
                                    {zonasEnvio.map((zona) => (
                                        <tr key={zona.id} className="hover:bg-stone-50/70">
                                            <td className="py-3.5 px-4 font-bold text-stone-900">
                                                {zona.nombre}
                                            </td>
                                            <td className="py-3.5 px-4 font-black text-emerald-700">
                                                S/ {Number(zona.precio).toFixed(2)}
                                            </td>
                                            <td className="py-3.5 px-4 text-stone-600">
                                                {zona.tiempo_estimado || '30-45 min'}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span
                                                    className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                                        zona.activo
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}
                                                >
                                                    {zona.activo ? 'Habilitado' : 'Desactivado'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => openEditZona(zona)}
                                                        className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg text-xs"
                                                        title="Editar Zona"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteZona(zona)}
                                                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg text-xs"
                                                        title="Eliminar Zona"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {zonasEnvio.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-stone-400 italic">
                                                No hay zonas de envío registradas. Pulsa en "Nueva Zona de Envío" para agregar la primera.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB CONTENT: CONFIGURACION DE TIENDA */}
                {activeTab === 'configuracion' && (
                    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 sm:p-8 space-y-8">
                        <div>
                            <div className="flex items-center gap-2.5 mb-1">
                                <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                                    <Phone className="w-5 h-5" />
                                </span>
                                <h3 className="text-xl font-bold text-stone-900">
                                    WhatsApp Oficial de la Tienda
                                </h3>
                            </div>
                            <p className="text-sm text-stone-500">
                                Configura el número de teléfono donde recibirás los pedidos generados por los clientes en la tienda.
                            </p>
                        </div>

                        {settingsSaveSuccess && (
                            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 flex items-center gap-3 animate-in fade-in">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                <div className="text-sm font-semibold">
                                    ¡El número de WhatsApp de la tienda fue actualizado exitosamente! Los nuevos pedidos irán directamente a este número.
                                </div>
                            </div>
                        )}

                        {settingsError && (
                            <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                                <div className="text-sm font-semibold">{settingsError}</div>
                            </div>
                        )}

                        <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
                            <div>
                                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                                    Número de WhatsApp de Recepción de Pedidos
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="tel"
                                        required
                                        value={storeWhatsappPhone}
                                        onChange={(e) => setStoreWhatsappPhone(e.target.value)}
                                        placeholder="Ej: 51987654321"
                                        className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 focus:border-[#6D3B18] focus:ring-2 focus:ring-amber-200 outline-none"
                                    />
                                </div>
                                <p className="text-xs text-stone-500 mt-2 flex items-start gap-1.5">
                                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                    <span>
                                        Recomendación: Incluye el código de país sin símbolos (ejemplo: <strong>51</strong> para Perú + tu número celular: <strong>51987654321</strong>).
                                    </span>
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                                    Mensaje Personalizado o Nota de Bienvenida (Opcional)
                                </label>
                                <textarea
                                    value={storeWhatsappMessage}
                                    onChange={(e) => setStoreWhatsappMessage(e.target.value)}
                                    rows={3}
                                    placeholder="Ej: ¡Gracias por tu pedido! En breve un asesor confirmará los detalles de entrega."
                                    className="w-full text-sm p-3 rounded-xl border border-stone-300 focus:border-[#6D3B18] focus:ring-2 focus:ring-amber-200 outline-none"
                                />
                            </div>

                            {/* Card de Previsualización y Prueba */}
                            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 sm:p-5 space-y-3">
                                <span className="text-xs font-bold text-stone-600 uppercase tracking-wider block">
                                    Prueba de Enlace Directo
                                </span>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs text-stone-500">
                                            Enlace generado para la redirección de clientes:
                                        </p>
                                        <code className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 inline-block mt-1">
                                            https://wa.me/{storeWhatsappPhone.replace(/\D/g, '') || 'TU_NUMERO'}
                                        </code>
                                    </div>

                                    {storeWhatsappPhone.replace(/\D/g, '').length >= 6 && (
                                        <a
                                            href={`https://api.whatsapp.com/send/?phone=${storeWhatsappPhone.replace(/\D/g, '')}&text=${encodeURIComponent('Hola, este es un mensaje de prueba para verificar el WhatsApp de mi tienda.')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            <span>Probar en WhatsApp</span>
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="pt-2 flex items-center gap-3">
                                <Button
                                    type="submit"
                                    disabled={isSavingSettings}
                                    className="bg-[#6D3B18] hover:bg-[#522c12] text-white font-bold px-6 py-2.5 rounded-xl text-sm inline-flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>{isSavingSettings ? 'Guardando...' : 'Guardar Configuración'}</span>
                                </Button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {/* MODAL EDITAR / CREAR PACK */}
            {packModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
                        <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                            <h3 className="font-bold text-lg text-stone-900">
                                {editingPack ? 'Editar Pack' : 'Crear Nuevo Pack'}
                            </h3>
                            <button
                                onClick={() => setPackModalOpen(false)}
                                className="text-stone-400 hover:text-stone-600 font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSavePack} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">
                                    Nombre del Pack
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={packForm.nombre}
                                    onChange={(e) => setPackForm({ ...packForm, nombre: e.target.value })}
                                    placeholder="Ej. Pack 7 Marcianos"
                                    className="w-full text-xs rounded-xl border-stone-300 px-3 py-2"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-stone-700 mb-1">
                                        Precio (S/)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.10"
                                        min="0"
                                        required
                                        value={packForm.precio}
                                        onChange={(e) => setPackForm({ ...packForm, precio: e.target.value })}
                                        className="w-full text-xs rounded-xl border-stone-300 px-3 py-2"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-stone-700 mb-1">
                                        Marcianos
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={packForm.cantidad_marcianos}
                                        onChange={(e) =>
                                            setPackForm({ ...packForm, cantidad_marcianos: e.target.value })
                                        }
                                        className="w-full text-xs rounded-xl border-stone-300 px-3 py-2"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 items-center">
                                <div>
                                    <label className="block text-xs font-bold text-stone-700 mb-1">
                                        Marcianos Gratis (Regalo)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        required
                                        value={packForm.cantidad_regalo}
                                        onChange={(e) =>
                                            setPackForm({ ...packForm, cantidad_regalo: e.target.value })
                                        }
                                        className="w-full text-xs rounded-xl border-stone-300 px-3 py-2"
                                    />
                                </div>

                                <label className="flex items-center gap-2 mt-5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={packForm.activo}
                                        onChange={(e) => setPackForm({ ...packForm, activo: e.target.checked })}
                                        className="w-4 h-4 rounded text-[#6D3B18]"
                                    />
                                    <span className="text-xs font-semibold text-stone-800">Pack Activo</span>
                                </label>
                            </div>

                            <div className="pt-4 flex items-center justify-end gap-2 border-t border-stone-100">
                                <button
                                    type="button"
                                    onClick={() => setPackModalOpen(false)}
                                    className="px-4 py-2 bg-stone-100 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#6D3B18] text-white rounded-xl text-xs font-bold hover:bg-[#572e12]"
                                >
                                    Guardar Pack
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL EDITAR / CREAR SABOR */}
            {saborModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
                        <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                            <h3 className="font-bold text-lg text-stone-900">
                                {editingSabor ? 'Editar Sabor' : 'Crear Nuevo Sabor'}
                            </h3>
                            <button
                                onClick={() => setSaborModalOpen(false)}
                                className="text-stone-400 hover:text-stone-600 font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveSabor} className="space-y-3.5">
                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">
                                    Nombre del Sabor
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={saborForm.nombre}
                                    onChange={(e) => setSaborForm({ ...saborForm, nombre: e.target.value })}
                                    placeholder="Ej. Lúcuma de Seda con Manjar"
                                    className="w-full text-xs rounded-xl border-stone-300 px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">
                                    Descripción
                                </label>
                                <textarea
                                    rows={2}
                                    value={saborForm.descripcion}
                                    onChange={(e) => setSaborForm({ ...saborForm, descripcion: e.target.value })}
                                    placeholder="Pulpa natural, ingredientes..."
                                    className="w-full text-xs rounded-xl border-stone-300 px-3 py-1.5"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">
                                    Subir Foto o URL de Imagen
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setSaborFile(e.target.files?.[0] || null)}
                                    className="w-full text-xs mb-1"
                                />
                                <input
                                    type="url"
                                    value={saborForm.imagen_url_input}
                                    onChange={(e) =>
                                        setSaborForm({ ...saborForm, imagen_url_input: e.target.value })
                                    }
                                    placeholder="O pega una URL: https://..."
                                    className="w-full text-xs rounded-xl border-stone-300 px-3 py-1.5"
                                />
                            </div>

                            <div className="flex items-center gap-4 pt-1">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={saborForm.es_premium}
                                        onChange={(e) =>
                                            setSaborForm({ ...saborForm, es_premium: e.target.checked })
                                        }
                                        className="w-4 h-4 rounded text-amber-600"
                                    />
                                    <span className="text-xs font-bold text-stone-800">¿Es Premium? ⭐</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={saborForm.stock_activo}
                                        onChange={(e) =>
                                            setSaborForm({ ...saborForm, stock_activo: e.target.checked })
                                        }
                                        className="w-4 h-4 rounded text-emerald-600"
                                    />
                                    <span className="text-xs font-bold text-stone-800">En Stock</span>
                                </label>
                            </div>

                            {saborForm.es_premium && (
                                <div>
                                    <label className="block text-xs font-bold text-stone-700 mb-1">
                                        Recargo Premium Adicional (S/)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.10"
                                        min="0"
                                        required
                                        value={saborForm.precio_adicional}
                                        onChange={(e) =>
                                            setSaborForm({ ...saborForm, precio_adicional: e.target.value })
                                        }
                                        className="w-full text-xs rounded-xl border-stone-300 px-3 py-2"
                                    />
                                </div>
                            )}

                            <div className="pt-4 flex items-center justify-end gap-2 border-t border-stone-100">
                                <button
                                    type="button"
                                    onClick={() => setSaborModalOpen(false)}
                                    className="px-4 py-2 bg-stone-100 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#6D3B18] text-white rounded-xl text-xs font-bold hover:bg-[#572e12]"
                                >
                                    Guardar Sabor
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL CREAR / EDITAR ZONA DE ENVIO */}
            {zonaModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
                        <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                            <h3 className="font-bold text-lg text-stone-900">
                                {editingZona ? 'Editar Zona de Envío' : 'Agregar Zona de Envío'}
                            </h3>
                            <button
                                onClick={() => setZonaModalOpen(false)}
                                className="text-stone-400 hover:text-stone-600 font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveZona} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">
                                    Distrito / Nombre de la Zona
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={zonaForm.nombre}
                                    onChange={(e) => setZonaForm({ ...zonaForm, nombre: e.target.value })}
                                    placeholder="Ej. Miraflores, San Isidro, Surco..."
                                    className="w-full text-xs rounded-xl border border-stone-300 px-3 py-2"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-stone-700 mb-1">
                                        Precio de Envío (S/)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.50"
                                        min="0"
                                        required
                                        value={zonaForm.precio}
                                        onChange={(e) => setZonaForm({ ...zonaForm, precio: e.target.value })}
                                        placeholder="Ej. 8.00"
                                        className="w-full text-xs rounded-xl border border-stone-300 px-3 py-2"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-stone-700 mb-1">
                                        Tiempo Estimado
                                    </label>
                                    <input
                                        type="text"
                                        value={zonaForm.tiempo_estimado}
                                        onChange={(e) => setZonaForm({ ...zonaForm, tiempo_estimado: e.target.value })}
                                        placeholder="Ej. 30-45 min"
                                        className="w-full text-xs rounded-xl border border-stone-300 px-3 py-2"
                                    />
                                </div>
                            </div>

                            <label className="flex items-center gap-2 pt-1 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={zonaForm.activo}
                                    onChange={(e) => setZonaForm({ ...zonaForm, activo: e.target.checked })}
                                    className="rounded border-stone-300 text-[#6D3B18] focus:ring-[#6D3B18]"
                                />
                                <span className="text-xs font-bold text-stone-700">
                                    Zona de envío activa / habilitada para clientes
                                </span>
                            </label>

                            <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setZonaModalOpen(false)}
                                    className="px-4 py-2 bg-stone-100 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#6D3B18] text-white rounded-xl text-xs font-bold hover:bg-[#572e12]"
                                >
                                    Guardar Zona
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DETALLE DE PEDIDO */}
            {viewingPedido && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setViewingPedido(null)}
                >
                    <div
                        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-stone-200 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between pb-3 border-b border-stone-100">
                            <div>
                                <h3 className="font-bold text-lg text-stone-900">Detalle del pedido</h3>
                                <p className="text-xs font-mono font-bold text-[#6D3B18]">{viewingPedido.codigo_orden}</p>
                                <p className="text-[11px] text-stone-400">
                                    {viewingPedido.fecha_pedido
                                        ? new Date(viewingPedido.fecha_pedido).toLocaleString('es-PE', {
                                              dateStyle: 'medium',
                                              timeStyle: 'short',
                                          })
                                        : '-'}
                                </p>
                            </div>
                            <button
                                onClick={() => setViewingPedido(null)}
                                className="text-stone-400 hover:text-stone-600"
                                aria-label="Cerrar"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-100 text-xs space-y-2">
                            <div className="flex justify-between gap-3">
                                <span className="text-stone-500">Cliente</span>
                                <span className="font-semibold text-stone-800 text-right">{viewingPedido.cliente_nombre}</span>
                            </div>
                            <div className="flex justify-between gap-3">
                                <span className="text-stone-500">Teléfono</span>
                                <a
                                    href={`https://wa.me/51${viewingPedido.cliente_telefono.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-semibold text-emerald-600 hover:underline"
                                >
                                    {viewingPedido.cliente_telefono}
                                </a>
                            </div>
                            {viewingPedido.telefono_respaldo && (
                                <div className="flex justify-between gap-3">
                                    <span className="text-stone-500">Tel. respaldo</span>
                                    <span className="font-semibold text-stone-800">{viewingPedido.telefono_respaldo}</span>
                                </div>
                            )}
                            <div className="flex justify-between gap-3">
                                <span className="text-stone-500">Estado</span>
                                <span className="font-semibold capitalize text-stone-800">{viewingPedido.estado}</span>
                            </div>
                        </div>

                        <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-100 text-xs space-y-2">
                            <div className="flex justify-between gap-3">
                                <span className="text-stone-500">Tipo de entrega</span>
                                <span className="font-semibold capitalize text-stone-800">{viewingPedido.tipo_entrega}</span>
                            </div>
                            {viewingPedido.tipo_entrega === 'delivery' && (
                                <>
                                    <div className="flex justify-between gap-3">
                                        <span className="text-stone-500">Zona</span>
                                        <span className="font-semibold text-stone-800 text-right">
                                            {viewingPedido.zona_envio || 'No registrada'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <span className="text-stone-500 inline-flex items-center gap-1">
                                            <MapPin className="w-3 h-3" /> Dirección
                                        </span>
                                        <span className="font-semibold text-stone-800 text-right">
                                            {viewingPedido.direccion_entrega || 'No registrada'}
                                        </span>
                                    </div>
                                    {viewingPedido.costo_envio != null && (
                                        <div className="flex justify-between gap-3">
                                            <span className="text-stone-500">Costo de envío</span>
                                            <span className="font-semibold text-stone-800">
                                                S/ {Number(viewingPedido.costo_envio).toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                </>
                            )}
                            {viewingPedido.notas && (
                                <div className="pt-2 border-t border-stone-200">
                                    <span className="text-stone-500 block mb-0.5">Notas / Dedicatoria</span>
                                    <span className="font-semibold text-stone-800">{viewingPedido.notas}</span>
                                </div>
                            )}
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-stone-700 mb-2">Sabores</h4>
                            <ul className="text-xs space-y-1">
                                {viewingPedido.detalles.map((det) => (
                                    <li key={det.id} className="flex items-center justify-between gap-2 text-stone-700">
                                        <span>
                                            {det.cantidad}x {det.sabor?.nombre}
                                            {det.sabor?.es_premium && (
                                                <span className="ml-1 text-[10px] bg-amber-100 text-amber-800 px-1 rounded font-bold">
                                                    Premium
                                                </span>
                                            )}
                                        </span>
                                        {det.es_regalo && (
                                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1 rounded font-bold">
                                                Regalo
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                            <span className="text-sm font-bold text-stone-700">Total</span>
                            <span className="text-lg font-black text-stone-900">
                                S/ {Number(viewingPedido.total).toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL CONFIRMACIÓN ELIMINAR PEDIDO */}
            {deletingPedido && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                                <Trash2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-base text-stone-900">
                                    ¿Eliminar este pedido?
                                </h3>
                                <p className="text-xs text-stone-500 font-mono">
                                    {deletingPedido.codigo_orden}
                                </p>
                            </div>
                        </div>

                        <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-100 text-xs text-stone-600 space-y-1.5">
                            <div className="flex justify-between">
                                <span className="text-stone-500">Cliente:</span>
                                <span className="font-semibold text-stone-800">{deletingPedido.cliente_nombre}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-stone-500">Teléfono:</span>
                                <span className="font-semibold text-stone-800">{deletingPedido.cliente_telefono}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-stone-500">Total:</span>
                                <span className="font-black text-stone-900">S/ {Number(deletingPedido.total).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-stone-500">Estado actual:</span>
                                <span className="font-semibold capitalize text-stone-800">{deletingPedido.estado}</span>
                            </div>
                        </div>

                        <p className="text-xs text-stone-500">
                            Esta acción no se puede deshacer y eliminará el pedido junto con los detalles de sabores registrados.
                        </p>

                        <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                            <button
                                type="button"
                                disabled={isDeletingPedido}
                                onClick={() => setDeletingPedido(null)}
                                className="px-4 py-2 bg-stone-100 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-200 transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                disabled={isDeletingPedido}
                                onClick={confirmDeletePedido}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
                            >
                                {isDeletingPedido ? (
                                    <>
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        <span>Eliminando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Sí, eliminar pedido</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard Administrador',
            href: dashboard(),
        },
    ],
};
