import React, { useState, useMemo, useEffect } from 'react';
import { Head } from '@inertiajs/react';

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

interface ArmaTuPackProps {
    packs: PackItem[];
    sabores: SaborItem[];
    zonasEnvio?: ZonaEnvioItem[];
    whatsappPhone?: string;
}

const LOGO_URL = '/images/logo.png';

export default function ArmaTuPack({
    packs = [],
    sabores = [],
    zonasEnvio = [],
    whatsappPhone = '51987654321',
}: ArmaTuPackProps) {
    // Delivery zone state
    const [selectedZonaId, setSelectedZonaId] = useState<number>(() => {
        return zonasEnvio[0]?.id || 1;
    });

    useEffect(() => {
        if (zonasEnvio.length > 0 && !zonasEnvio.find((z) => z.id === selectedZonaId)) {
            setSelectedZonaId(zonasEnvio[0].id);
        }
    }, [zonasEnvio]);

    const selectedZona = useMemo(() => {
        return zonasEnvio.find((z) => z.id === selectedZonaId) || zonasEnvio[0];
    }, [zonasEnvio, selectedZonaId]);

    // Pack selection state
    const [selectedPackId, setSelectedPackId] = useState<number>(packs[0]?.id || 1);
    const [packQuantities, setPackQuantities] = useState<Record<number, number>>(() => {
        const initial: Record<number, number> = {};
        packs.forEach((p, idx) => {
            initial[p.id] = idx === 0 ? 1 : 0;
        });
        return initial;
    });

    // Flavors selection: { [saborId]: quantity }
    const [selectedFlavors, setSelectedFlavors] = useState<Record<number, number>>({});

    // Courtesy gifts selection: array of flavor IDs, one for each gift slot
    const defaultGiftSaborId = useMemo(() => {
        const firstAvailable = sabores.find((s) => !s.es_premium && s.stock_activo) || sabores.find((s) => s.stock_activo) || sabores[0];
        return firstAvailable?.id || 1;
    }, [sabores]);

    const [freeGiftFlavorIds, setFreeGiftFlavorIds] = useState<number[]>(() => {
        const firstId = sabores.find((s) => !s.es_premium && s.stock_activo)?.id || sabores[0]?.id || 1;
        const initialGifts = packs[0]?.cantidad_regalo || 1;
        return Array.from({ length: initialGifts }, () => firstId);
    });

    // Category tab filter
    const [activeCategory, setActiveCategory] = useState<'all' | 'leche' | 'frutales' | 'premium'>('all');

    // Addons state
    const [addonsOpen, setAddonsOpen] = useState(false);
    const [addonIce, setAddonIce] = useState(false);
    const [addonBox, setAddonBox] = useState(false);
    const [addonCard, setAddonCard] = useState(false);

    // Customer details
    const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
    const [custDni, setCustDni] = useState('');
    const [isFirstPurchase, setIsFirstPurchase] = useState<boolean | null>(null);
    const [isCheckingDni, setIsCheckingDni] = useState(false);
    const [dniFeedback, setDniFeedback] = useState<string | null>(null);
    const [custName, setCustName] = useState('');
    const [custPhone, setCustPhone] = useState('');
    const [custBackupPhone, setCustBackupPhone] = useState('');
    const [custAddress, setCustAddress] = useState('');
    const [custNotes, setCustNotes] = useState('');

    const checkDniHistory = async (dniToCheck: string) => {
        const cleaned = dniToCheck.replace(/\D/g, '');
        if (cleaned.length !== 8) {
            setIsFirstPurchase(null);
            setDniFeedback(null);
            return;
        }

        setIsCheckingDni(true);
        try {
            const res = await fetch(`/pedidos/verificar-dni/${cleaned}`);
            const data = await res.json();
            if (res.ok) {
                setIsFirstPurchase(data.es_primera_compra);
                setDniFeedback(data.mensaje);
            } else {
                setDniFeedback(data.mensaje || 'Error al validar DNI.');
            }
        } catch (err) {
            console.error('Error al verificar DNI:', err);
        } finally {
            setIsCheckingDni(false);
        }
    };

    const handleDniChange = (val: string) => {
        const digitsOnly = val.replace(/\D/g, '').slice(0, 8);
        setCustDni(digitsOnly);
        if (digitsOnly.length === 8) {
            checkDniHistory(digitsOnly);
        } else {
            setIsFirstPurchase(null);
            setDniFeedback(null);
        }
    };

    // Submission states
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [orderSuccess, setOrderSuccess] = useState<{
        codigo_orden: string;
        total: string;
        whatsappUrl: string;
    } | null>(null);

    // Sync packQuantities if packs prop changes
    useEffect(() => {
        if (packs.length > 0 && !packQuantities[packs[0].id]) {
            const initial: Record<number, number> = {};
            packs.forEach((p, idx) => {
                initial[p.id] = idx === 0 ? 1 : 0;
            });
            setPackQuantities(initial);
            setSelectedPackId(packs[0].id);
        }
    }, [packs]);

    // Active main pack (for primary single-pack submission)
    const activePack = useMemo(() => {
        return packs.find((p) => p.id === selectedPackId) || packs[0];
    }, [packs, selectedPackId]);

    // Calculations based on pack quantities
    const totalTargetFlavors = useMemo(() => {
        return Object.entries(packQuantities).reduce((acc, [packIdStr, qty]) => {
            const p = packs.find((item) => item.id === Number(packIdStr));
            return acc + (p ? p.cantidad_marcianos * qty : 0);
        }, 0);
    }, [packs, packQuantities]);

    const totalFreeGiftsCount = useMemo(() => {
        if (isFirstPurchase === false) {
            return 0;
        }
        return Object.entries(packQuantities).reduce((acc, [packIdStr, qty]) => {
            const p = packs.find((item) => item.id === Number(packIdStr));
            return acc + (p ? p.cantidad_regalo * qty : 0);
        }, 0);
    }, [packs, packQuantities, isFirstPurchase]);

    // Keep freeGiftFlavorIds in sync with totalFreeGiftsCount
    useEffect(() => {
        if (totalFreeGiftsCount <= 0) {
            setFreeGiftFlavorIds([]);
            return;
        }

        setFreeGiftFlavorIds((prev) => {
            if (prev.length === totalFreeGiftsCount) {
                return prev;
            }
            const updated = [...prev];
            if (updated.length < totalFreeGiftsCount) {
                while (updated.length < totalFreeGiftsCount) {
                    updated.push(defaultGiftSaborId);
                }
            } else if (updated.length > totalFreeGiftsCount) {
                updated.length = totalFreeGiftsCount;
            }
            return updated;
        });
    }, [totalFreeGiftsCount, defaultGiftSaborId]);

    const freeGiftSabores = useMemo(() => {
        const list: SaborItem[] = [];
        for (let i = 0; i < totalFreeGiftsCount; i++) {
            const sId = freeGiftFlavorIds[i] ?? defaultGiftSaborId;
            const s = sabores.find((item) => item.id === sId) || sabores[0];
            if (s) {
                list.push(s);
            }
        }
        return list;
    }, [freeGiftFlavorIds, totalFreeGiftsCount, defaultGiftSaborId, sabores]);

    const giftSummary = useMemo(() => {
        const countMap: Record<number, { sabor: SaborItem; count: number }> = {};
        freeGiftSabores.forEach((s) => {
            if (!countMap[s.id]) {
                countMap[s.id] = { sabor: s, count: 0 };
            }
            countMap[s.id].count += 1;
        });
        return Object.values(countMap);
    }, [freeGiftSabores]);

    const totalSelectedFlavorsCount = useMemo(() => {
        return Object.values(selectedFlavors).reduce((acc, qty) => acc + qty, 0);
    }, [selectedFlavors]);

    // Financial calculations
    const packsSubtotal = useMemo(() => {
        return Object.entries(packQuantities).reduce((acc, [packIdStr, qty]) => {
            const p = packs.find((item) => item.id === Number(packIdStr));
            return acc + (p ? Number(p.precio) * qty : 0);
        }, 0);
    }, [packs, packQuantities]);

    const premiumSurcharge = useMemo(() => {
        const packPremium = Object.entries(selectedFlavors).reduce((acc, [saborIdStr, qty]) => {
            const s = sabores.find((item) => item.id === Number(saborIdStr));
            if (s && s.es_premium) {
                return acc + Number(s.precio_adicional) * qty;
            }
            return acc;
        }, 0);

        const giftPremium = freeGiftSabores.reduce((acc, s) => {
            if (s && s.es_premium) {
                return acc + Number(s.precio_adicional);
            }
            return acc;
        }, 0);

        return packPremium + giftPremium;
    }, [sabores, selectedFlavors, freeGiftSabores]);

    const addonsTotal = useMemo(() => {
        let total = 0;
        if (addonIce) total += 3.50;
        if (addonBox) total += 5.00;
        return total;
    }, [addonIce, addonBox]);

    const deliveryCost = deliveryMethod === 'delivery'
        ? (selectedZona ? Number(selectedZona.precio) : 8.00)
        : 0.00;
    const grandTotal = packsSubtotal + premiumSurcharge + addonsTotal + deliveryCost;

    // Categorization helper for flavors
    const categorizeSabor = (sabor: SaborItem): 'leche' | 'frutales' | 'premium' => {
        if (sabor.es_premium) return 'premium';
        const nameLower = (sabor.nombre + ' ' + (sabor.descripcion || '')).toLowerCase();
        if (
            nameLower.includes('leche') ||
            nameLower.includes('coco') ||
            nameLower.includes('sublime') ||
            nameLower.includes('chocolate') ||
            nameLower.includes('chocomenta') ||
            nameLower.includes('menta') ||
            nameLower.includes('capuchino') ||
            nameLower.includes('chicle') ||
            nameLower.includes('bobbaloo') ||
            nameLower.includes('oreo')
        ) {
            return 'leche';
        }
        return 'frutales';
    };

    // Emoji icon helper
    const getSaborEmoji = (nombre: string): string => {
        const n = nombre.toLowerCase();
        if (n.includes('capuchino') || n.includes('café') || n.includes('cafe')) return '☕';
        if (n.includes('chicle') || n.includes('bobbaloo')) return '🍬';
        if (n.includes('menta') || n.includes('chocomenta')) return '🌿';
        if (n.includes('coco')) return '🥥';
        if (n.includes('sublime') || n.includes('chocolate')) return '🍫';
        if (n.includes('fresa')) return '🍓';
        if (n.includes('lúcuma') || n.includes('lucuma')) return '🍮';
        if (n.includes('maracuyá') || n.includes('maracuya') || n.includes('mango')) return '🥭';
        if (n.includes('baileys')) return '🍸';
        if (n.includes('pisco')) return '🍋';
        if (n.includes('chicha')) return '🍇';
        if (n.includes('oreo') || n.includes('cookie')) return '🍪';
        if (n.includes('nutella')) return '🌰';
        if (n.includes('pistacho')) return '🥑';
        return '🍦';
    };

    // Change pack quantity
    const changePackQty = (packId: number, delta: number) => {
        const currentQty = packQuantities[packId] || 0;
        const newQty = Math.max(0, currentQty + delta);

        const otherPacksTotal = Object.entries(packQuantities).reduce((acc, [idStr, q]) => {
            return Number(idStr) === packId ? acc : acc + q;
        }, 0);

        if (newQty === 0 && otherPacksTotal === 0) {
            alert('Debes mantener al menos 1 pack seleccionado para continuar tu pedido.');
            return;
        }

        setPackQuantities((prev) => ({
            ...prev,
            [packId]: newQty,
        }));

        if (newQty > 0) {
            setSelectedPackId(packId);
        }
    };

    // Select pack directly by clicking card
    const handleSelectPackCard = (packId: number) => {
        setSelectedPackId(packId);
        setPackQuantities((prev) => {
            const next: Record<number, number> = {};
            packs.forEach((p) => {
                next[p.id] = p.id === packId ? 1 : 0;
            });
            return next;
        });
    };

    // Change flavor quantity
    const changeFlavorQty = (saborId: number, delta: number) => {
        const currentQty = selectedFlavors[saborId] || 0;

        if (delta > 0 && totalSelectedFlavorsCount >= totalTargetFlavors) {
            alert(`Ya alcanzaste el máximo de ${totalTargetFlavors} marcianos para tu pack. Si deseas más sabores, añade otro pack arriba.`);
            return;
        }

        const newQty = Math.max(0, currentQty + delta);
        setSelectedFlavors((prev) => ({
            ...prev,
            [saborId]: newQty,
        }));
    };

    // Filter flavors for display
    const displayedFlavors = useMemo(() => {
        if (activeCategory === 'all') return sabores;
        return sabores.filter((s) => categorizeSabor(s) === activeCategory);
    }, [sabores, activeCategory]);

    // Active addons count
    const activeAddonsCount = (addonIce ? 1 : 0) + (addonBox ? 1 : 0) + (addonCard ? 1 : 0);

    // Clean phone number for WhatsApp redirect
    const cleanPhone = (whatsappPhone || '51987654321').replace(/\D/g, '');

    // Build formatted message matching reference
    const buildWhatsAppMessage = (codigoOrden?: string): string => {
        const packDetailsList: string[] = [];
        Object.entries(packQuantities).forEach(([pIdStr, qty]) => {
            if (qty > 0) {
                const p = packs.find((item) => item.id === Number(pIdStr));
                if (p) {
                    packDetailsList.push(`* ${qty} x ${p.nombre.toUpperCase()} – S/ ${(Number(p.precio) * qty).toFixed(2)}`);
                }
            }
        });

        const flavorLines: string[] = [];
        Object.entries(selectedFlavors).forEach(([sIdStr, qty]) => {
            if (qty > 0) {
                const s = sabores.find((item) => item.id === Number(sIdStr));
                if (s) {
                    flavorLines.push(`* ${qty} x ${s.nombre}`);
                }
            }
        });

        const premiumPackCount = Object.entries(selectedFlavors).reduce((acc, [sIdStr, qty]) => {
            const s = sabores.find((item) => item.id === Number(sIdStr));
            return acc + (s && s.es_premium ? qty : 0);
        }, 0);

        const premiumGiftCount = freeGiftSabores.reduce((acc, s) => {
            return acc + (s && s.es_premium ? 1 : 0);
        }, 0);

        const totalPremiumCount = premiumPackCount + premiumGiftCount;
        const premiumUnitRate = sabores.find((s) => s.es_premium)?.precio_adicional || 1.50;

        const totalMarcianos = totalSelectedFlavorsCount + totalFreeGiftsCount;

        let msg = `🧊 Nº PEDIDO: ${codigoOrden ? `#${codigoOrden}` : ''}\n\n`;

        msg += `👤 CLIENTE: ${custName.trim().toUpperCase()}\n`;
        if (custDni.trim()) {
            msg += `🪪 DNI: ${custDni.trim()}\n`;
        }
        msg += `📞 TELÉFONO: ${custPhone.trim()}\n`;
        msg += `🗂️ Nº RESPALDO: ${custBackupPhone.trim() || 'No indicado'}\n`;
        msg += `📍 DISTRITO: ${deliveryMethod === 'delivery' ? (selectedZona?.nombre || 'Lima') : 'Recojo en tienda'}\n`;
        msg += `CANT. TOTAL MARCIANOS: ${totalMarcianos}\n\n`;

        msg += `📦 Packs seleccionados:\n`;
        if (packDetailsList.length > 0) {
            msg += `${packDetailsList.join('\n')}\n`;
        }
        msg += `⚠️ Saldo a favor o compensación anterior: No indicado\n`;
        msg += `⭐ Premium: ${totalPremiumCount} x S/ ${Number(premiumUnitRate).toFixed(2)} = S/ ${premiumSurcharge.toFixed(2)}\n`;
        msg += `Adicionales: ${activeAddonsCount} = S/ ${addonsTotal.toFixed(2)}\n`;
        msg += `💰 TOTAL: S/ ${grandTotal.toFixed(2)}\n\n`;

        msg += `🍓 Sabores de los packs:\n`;
        msg += `${flavorLines.join('\n')}\n`;

        if (giftSummary.length > 0) {
            msg += `🎁 Sabores de regalo:\n`;
            giftSummary.forEach((g) => {
                msg += `* ${g.count} x ${g.sabor.nombre}\n`;
            });
        }

        msg += `\n🛵 Modalidad: ${deliveryMethod === 'delivery' ? 'Envío' : 'Recojo en tienda'}\n`;
        if (deliveryMethod === 'delivery' && custAddress.trim()) {
            msg += `📍 Dirección: ${custAddress.trim()}\n`;
        }
        if (custNotes.trim()) {
            msg += `📝 Notas: ${custNotes.trim()}\n`;
        }

        return msg;
    };

    // Submit order to backend & redirect to WhatsApp
    const handleCheckout = async () => {
        setErrorMessage(null);

        if (totalSelectedFlavorsCount < totalTargetFlavors) {
            const missing = totalTargetFlavors - totalSelectedFlavorsCount;
            alert(`Te faltan elegir ${missing} marciano${missing > 1 ? 's' : ''} para completar tu pack.`);
            document.getElementById('paso-sabores')?.scrollIntoView({ behavior: 'smooth' });
            return;
        }

        if (custDni.trim().length !== 8) {
            alert('Por favor ingresa un número de DNI válido de 8 dígitos.');
            document.getElementById('datos-entrega')?.scrollIntoView({ behavior: 'smooth' });
            return;
        }

        if (!custName.trim() || !custPhone.trim()) {
            alert('Por favor completa los datos obligatorios: Nombre y WhatsApp.');
            document.getElementById('datos-entrega')?.scrollIntoView({ behavior: 'smooth' });
            return;
        }

        if (deliveryMethod === 'delivery' && !custAddress.trim()) {
            alert('Por favor ingresa tu Dirección de entrega para el delivery.');
            document.getElementById('datos-entrega')?.scrollIntoView({ behavior: 'smooth' });
            return;
        }

        setIsSubmitting(true);

        try {
            const csrfTokenMeta = document.querySelector('meta[name="csrf-token"]');
            const csrfToken = csrfTokenMeta ? csrfTokenMeta.getAttribute('content') : '';

            // Map flavors for API
            const saboresPackArray = Object.entries(selectedFlavors)
                .filter(([_, q]) => q > 0)
                .map(([sId, q]) => ({
                    sabor_id: Number(sId),
                    cantidad: q,
                }));

            const saboresRegaloArray = isFirstPurchase === false
                ? []
                : giftSummary.map((g) => ({
                    sabor_id: g.sabor.id,
                    cantidad: g.count,
                }));

            const payload = {
                cliente_dni: custDni.trim(),
                cliente_nombre: custName.trim(),
                cliente_telefono: custPhone.trim(),
                telefono_respaldo: custBackupPhone.trim() || null,
                tipo_entrega: deliveryMethod,
                direccion_entrega: deliveryMethod === 'delivery' ? custAddress.trim() : null,
                zona_envio: deliveryMethod === 'delivery' ? selectedZona?.nombre || null : null,
                costo_envio: deliveryMethod === 'delivery' ? deliveryCost : null,
                notas: custNotes.trim() || null,
                pack_id: activePack?.id || 1,
                sabores_pack: saboresPackArray,
                sabores_regalo: saboresRegaloArray,
            };

            const response = await fetch('/pedidos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.errors) {
                    const firstErr = Object.values(data.errors)[0] as string[];
                    throw new Error(firstErr?.[0] || 'Error de validación al procesar el pedido.');
                }
                throw new Error(data.message || 'Error al guardar el pedido en el servidor.');
            }

            const codigoOrden = data.codigo_orden;
            const messageText = buildWhatsAppMessage(codigoOrden);
            const whatsappUrl = `https://api.whatsapp.com/send/?phone=${cleanPhone}&text=${encodeURIComponent(messageText)}`;

            setOrderSuccess({
                codigo_orden: codigoOrden,
                total: grandTotal.toFixed(2),
                whatsappUrl,
            });

            // Open WhatsApp directly
            window.open(whatsappUrl, '_blank');
        } catch (err: any) {
            console.error('Error procesando pedido:', err);
            // Even if backend has an error, allow WhatsApp fallback
            const fallbackMsg = buildWhatsAppMessage();
            const fallbackUrl = `https://api.whatsapp.com/send/?phone=${cleanPhone}&text=${encodeURIComponent(fallbackMsg)}`;
            window.open(fallbackUrl, '_blank');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="font-sans bg-[#FAF8F5] text-[#1E201E] antialiased min-h-screen flex flex-col">
            <Head>
                <title>Loreanne | Arma tu Pack</title>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
            </Head>

            {/* HEADER */}
            <header className="sticky top-0 z-50 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E2DDD6]/60">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        {/* <img
                            alt="Loreanne Logo"
                            className="h-10 w-10 object-contain rounded-full shadow-xs border border-[#E2DDD6] bg-white p-0.5"
                            src={LOGO_URL}
                        />
                        <div className="flex flex-col">
                            <span className="font-display font-extrabold text-xl text-[#00685F] leading-tight tracking-tight">
                                Loreanne
                            </span>
                            <span className="text-xs text-[#555A58] font-medium flex items-center gap-1">
                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Arma tu Pack • Lima, Perú
                            </span>
                        </div> */}
                        <img src="./images/loreanne.png" alt="" className="w-32" />
                    </div>

                    <nav className="hidden md:flex items-center gap-1 bg-[#F3EFEA]/70 p-1 rounded-full border border-[#E2DDD6]/60">
                        <a
                            className="px-4 py-1.5 rounded-full text-xs font-semibold bg-[#00685F] text-white shadow-sm"
                            href="#paso-packs"
                        >
                            Armar Pack
                        </a>
                        <a
                            className="px-4 py-1.5 rounded-full text-xs font-semibold text-[#555A58] hover:text-[#1E201E] transition-colors"
                            href="#paso-sabores"
                        >
                            Sabores
                        </a>
                        <a
                            className="px-4 py-1.5 rounded-full text-xs font-semibold text-[#555A58] hover:text-[#1E201E] transition-colors"
                            href="#datos-entrega"
                        >
                            Cobertura Delivery
                        </a>
                    </nav>

                    <div className="flex items-center gap-3">
                        <a
                            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200/80 hover:bg-emerald-100 transition-colors"
                            href={`https://wa.me/${cleanPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <span className="material-symbols-outlined text-[16px] text-[#25D366]">chat</span>
                            <span>Consultas</span>
                        </a>
                    </div>
                </div>
            </header>

            {/* MAIN SPLIT-SCREEN GRID */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* LEFT COLUMN */}
                    <section className="lg:col-span-7 xl:col-span-8 space-y-6">
                        {/* Gourmet Visual Banner */}
                        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-white border border-[#E2DDD6]/80 shadow-gourmet">
                            {/* <div className="absolute -right-8 -top-8 w-44 h-44 bg-amber-200/30 rounded-full blur-2xl pointer-events-none"></div>
                            <div className="absolute -left-8 -bottom-8 w-48 h-48 bg-emerald-200/30 rounded-full blur-2xl pointer-events-none"></div> */}

                            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                                <div className="space-y-2 max-w-xl">
                                    
                                    <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#1E201E] tracking-tight">
                                        Arma tu Pack
                                    </h1>
                                    <p className="text-sm text-[#555A58] leading-relaxed">
                                        Elige el tamaño de tu pack, combina tus sabores preferidos y recibe tu pedido listo para congelar o disfrutar al instante.
                                    </p>
                                </div>
                                
                            </div>
                        </div>

                        {/* 1. Pack Selector Cards */}
                        <div id="paso-packs" className="bg-white rounded-3xl p-6 border border-[#E2DDD6]/80 shadow-sm space-y-4">
                            <div className="flex items-center justify-between bg-[#00685F] p-2 rounded-full text-white">
                                <div className="flex items-center gap-2.5 ">
                                    <span className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center font-display font-bold text-xs">
                                        1
                                    </span>
                                    <h2 className="font-display font-bold text-lg text-white">
                                        Selecciona el tamaño de tu pack
                                    </h2>
                                </div>
                                <span className="text-xs text-white font-semibold hidden sm:inline-flex items-center gap-1 px-2">
                                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                    Con regalo incluido por tu primera compra
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                {packs.map((pack, index) => {
                                    const qty = packQuantities[pack.id] || 0;
                                    const isSelected = qty > 0;
                                    const pricePerUnit = (Number(pack.precio) / (pack.cantidad_marcianos + pack.cantidad_regalo)).toFixed(2);

                                    return (
                                        <div
                                            key={pack.id}
                                            onClick={() => handleSelectPackCard(pack.id)}
                                            className={`pack-card relative p-4 rounded-2xl flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-sm hover:animate-latido ${
                                                isSelected
                                                    ? 'border-2 border-[#00685F] bg-[#E0F5F2]/20'
                                                    : 'border border-[#E2DDD6] bg-white hover:border-[#00685F]/50'
                                            }`}
                                        >
                                            
                                           

                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-display font-bold text-base text-[#1E201E]">
                                                        {pack.nombre}
                                                    </span>
                                                    <span className="font-display font-extrabold text-[#88512C] text-base">
                                                        S/ {Number(pack.precio).toFixed(2)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-[#555A58]">
                                                    {pack.cantidad_marcianos} marcianos +{' '}
                                                    <strong className="text-[#00685F] font-bold">
                                                        🎁 {pack.cantidad_regalo} Gratis
                                                    </strong>
                                                </p>
                                                
                                            </div>

                                            <div
                                                className="mt-4 pt-3 border-t border-[#E2DDD6]/60 flex items-center justify-between"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <span className="text-xs font-medium text-[#555A58]">
                                                    Cantidad:
                                                </span>
                                                <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-full border border-[#E2DDD6] shadow-xs">
                                                    <button
                                                        className="w-6 h-6 rounded-full bg-[#F3EFEA] hover:bg-[#EDE8E1] flex items-center justify-center text-[#1E201E] transition-colors"
                                                        onClick={() => changePackQty(pack.id, -1)}
                                                    >
                                                        <span className="material-symbols-outlined text-[14px]">remove</span>
                                                    </button>
                                                    <span className="font-display font-bold text-sm w-4 text-center">
                                                        {qty}
                                                    </span>
                                                    <button
                                                        className="w-6 h-6 rounded-full bg-[#00685F] text-white hover:bg-[#004D46] flex items-center justify-center transition-colors"
                                                        onClick={() => changePackQty(pack.id, 1)}
                                                    >
                                                        <span className="material-symbols-outlined text-[14px]">add</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 2. Interactive Flavors Catalog */}
                        <div id="paso-sabores" className="bg-white rounded-3xl p-6 border border-[#E2DDD6]/80 shadow-sm space-y-5">
                            {/* Step Header & Progress */}
                            <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#00685F] rounded-full p-2">
                                    <div className="flex items-center gap-2.5">
                                        <span className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center font-display font-bold text-xs">
                                            2
                                        </span>
                                        <div>
                                            <h2 className="font-display font-bold text-lg text-white">
                                                Combina tus Sabores Artesanales
                                            </h2>
                                            {/* <p className="text-xs text-[#555A58]">
                                                Elige y distribuye la cantidad que desees de cada sabor
                                            </p> */}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#F3EFEA] text-[#1E201E]">
                                            <span className="text-[#00685F] font-bold">
                                                {totalSelectedFlavorsCount}
                                            </span>{' '}
                                            de <span className="font-bold">{totalTargetFlavors}</span> marcianos elegidos
                                        </span>
                                        {totalSelectedFlavorsCount === totalTargetFlavors ? (
                                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#00685F] flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[13px]">check_circle</span>
                                                Completado
                                            </span>
                                        ) : (
                                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[13px]">pending</span>
                                                En progreso
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="w-full bg-[#F3EFEA] h-2 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-[#00685F] to-emerald-400 transition-all duration-300"
                                        style={{
                                            width: `${totalTargetFlavors > 0 ? Math.min(100, (totalSelectedFlavorsCount / totalTargetFlavors) * 100) : 0}%`,
                                        }}
                                    ></div>
                                </div>
                            </div>

                            {/* Category Filter Tabs */}
                            <div className="flex items-center gap-2 border-b border-[#E2DDD6]/70 pb-3 overflow-x-auto hide-scrollbar">
                                <button
                                    onClick={() => setActiveCategory('all')}
                                    className={`category-tab px-4 py-1.5 rounded-full text-xs transition-all flex items-center gap-1.5 whitespace-nowrap ${
                                        activeCategory === 'all'
                                            ? 'font-bold bg-[#00685F] text-white shadow-xs'
                                            : 'font-semibold bg-[#F3EFEA] text-[#555A58] hover:text-[#1E201E]'
                                    }`}
                                >
                                    <span>Todos los Sabores</span>
                                    <span className="w-4 h-4 rounded-full bg-white/20 text-white text-[10px] flex items-center justify-center">
                                        {sabores.length}
                                    </span>
                                </button>
                                {/* <button
                                    onClick={() => setActiveCategory('leche')}
                                    className={`category-tab px-4 py-1.5 rounded-full text-xs transition-all flex items-center gap-1.5 whitespace-nowrap ${
                                        activeCategory === 'leche'
                                            ? 'font-bold bg-[#00685F] text-white shadow-xs'
                                            : 'font-semibold bg-[#F3EFEA] text-[#555A58] hover:text-[#1E201E]'
                                    }`}
                                >
                                    <span>🥛 Clásicos de Leche</span>
                                </button>
                                <button
                                    onClick={() => setActiveCategory('frutales')}
                                    className={`category-tab px-4 py-1.5 rounded-full text-xs transition-all flex items-center gap-1.5 whitespace-nowrap ${
                                        activeCategory === 'frutales'
                                            ? 'font-bold bg-[#00685F] text-white shadow-xs'
                                            : 'font-semibold bg-[#F3EFEA] text-[#555A58] hover:text-[#1E201E]'
                                    }`}
                                >
                                    <span>🍓 Frutales Puros</span>
                                </button> */}
                                <button
                                    onClick={() => setActiveCategory('premium')}
                                    className={`category-tab px-4 py-1.5 rounded-full text-xs transition-all flex items-center gap-1.5 whitespace-nowrap ${
                                        activeCategory === 'premium'
                                            ? 'font-bold bg-[#E65100] text-white shadow-xs'
                                            : 'font-semibold bg-[#F3EFEA] text-[#555A58] hover:text-[#1E201E]'
                                    }`}
                                >
                                    <span>⭐ Premium</span>
                                </button>
                            </div>

                            {/* Flavor Cards Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                {displayedFlavors.map((sabor) => {
                                    const qty = selectedFlavors[sabor.id] || 0;
                                    const emoji = getSaborEmoji(sabor.nombre);

                                    return (
                                        <div
                                            key={sabor.id}
                                            className={`flavor-item group p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 shadow-xs hover:animate-latido ${
                                                sabor.es_premium
                                                    ? 'border-[#E65100]/40 hover:border-[#E65100] bg-gradient-to-r from-amber-50/40 to-white'
                                                    : 'border-[#E2DDD6] hover:border-[#00685F]/40 bg-white hover:bg-amber-50/20'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {sabor.imagen_url ? (
                                                    <img
                                                        src={sabor.imagen_url}
                                                        alt={sabor.nombre}
                                                        className="w-11 h-11 rounded-xl object-cover shadow-xs shrink-0"
                                                        onError={(e) => {
                                                            (e.target as HTMLElement).style.display = 'none';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-11 h-11 rounded-xl bg-amber-100/70 text-[#88512C] flex items-center justify-center shrink-0 text-xl font-bold shadow-xs">
                                                        {emoji}
                                                    </div>
                                                )}

                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <h3 className="font-display font-bold text-sm text-[#1E201E]">
                                                            {sabor.nombre}
                                                        </h3>
                                                    </div>
                                                    {sabor.es_premium ? (
                                                        <p className="text-xs text-[#88512C] font-semibold">
                                                            +S/ {Number(sabor.precio_adicional).toFixed(2)}{' '}
                                                            <span className="text-[#555A58] font-normal">
                                                                (recargo premium)
                                                            </span>
                                                        </p>
                                                    ) : (
                                                        <p className="text-xs text-[#555A58] line-clamp-1">
                                                            {sabor.descripcion || 'Sabor artesanal elaborado con fruta fresca'}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 bg-[#F3EFEA] p-1 rounded-full border border-[#E2DDD6]/80 shrink-0">
                                                <button
                                                    className="w-7 h-7 rounded-full bg-white hover:bg-stone-50 text-[#1E201E] flex items-center justify-center shadow-xs transition-transform active:scale-90 cursor-pointer"
                                                    onClick={() => changeFlavorQty(sabor.id, -1)}
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">remove</span>
                                                </button>
                                                <span className="w-5 text-center font-display font-bold text-xs text-[#1E201E]">
                                                    {qty}
                                                </span>
                                                <button
                                                    className={`w-7 h-7 rounded-full text-white flex items-center justify-center shadow-xs transition-transform active:scale-90 cursor-pointer ${
                                                        sabor.es_premium
                                                            ? 'bg-[#E65100] hover:bg-[#E65100]/90'
                                                            : 'bg-[#00685F] hover:bg-[#004D46]'
                                                    }`}
                                                    onClick={() => changeFlavorQty(sabor.id, 1)}
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">add</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 3. Free Gift Marcianos */}
                        {totalFreeGiftsCount > 0 && (
                            <div className="bg-gradient-to-r from-amber-50/80 via-white to-orange-50/60 rounded-3xl p-6 border border-amber-200/80 shadow-sm space-y-4">
                                <div className="flex items-center justify-between bg-[#E65100] p-2 rounded-full">
                                    <div className="flex items-center gap-2.5">
                                        <span className="w-7 h-7 rounded-full text-[#E65100] bg-white flex items-center justify-center font-display font-bold text-xs">
                                            3
                                        </span>
                                        <h2 className="font-display font-bold text-lg text-white">
                                            {totalFreeGiftsCount === 1 ? 'Tu Marciano de Cortesía 🎁' : `Tus ${totalFreeGiftsCount} Marcianos de Cortesía 🎁`}
                                        </h2>
                                    </div>
                                    <span className="px-2.5 py-0.5 rounded-full bg-[#E65100] text-white text-[11px] font-bold tracking-wide">
                                        {totalFreeGiftsCount} DISPONIBLE{totalFreeGiftsCount > 1 ? 'S' : ''}
                                    </span>
                                </div>
                                <p className="text-xs text-[#555A58]">
                                    {totalFreeGiftsCount === 1
                                        ? 'Por la compra de tu pack tienes 1 marciano de cortesía gratis exclusivo para tu primera compra. Elige cualquier sabor que desees:'
                                        : `Por la compra de tu pack tienes ${totalFreeGiftsCount} marcianos de cortesía exclusivos para tu primera compra. Puedes seleccionar cualquier sabor individualmente para cada regalo:`}
                                </p>

                                <div className="space-y-3 pt-1">
                                    {Array.from({ length: totalFreeGiftsCount }).map((_, idx) => {
                                        const currentFlavorId = freeGiftFlavorIds[idx] ?? defaultGiftSaborId;
                                        const currentSabor = sabores.find((s) => s.id === currentFlavorId) || sabores[0];

                                        return (
                                            <div
                                                key={`gift-slot-${idx}`}
                                                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3.5 rounded-2xl bg-white border border-amber-200/80 shadow-xs hover:border-amber-300 transition-all"
                                            >
                                                <div className="flex items-center gap-2.5 sm:w-44 shrink-0">
                                                    <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                                                        🎁 #{idx + 1}
                                                    </span>
                                                    <div>
                                                        <span className="text-xs font-bold text-white block">
                                                            {totalFreeGiftsCount > 1 ? `Cortesía #${idx + 1}` : 'Marciano de Cortesía'}
                                                        </span>
                                                        <span className="text-[11px] text-[#00685F] font-semibold">
                                                            100% Cortesía
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="relative flex-1">
                                                    <select
                                                        className="w-full h-11 pl-3.5 pr-10 rounded-xl bg-[#FAF8F5] border border-[#E2DDD6] font-semibold text-xs text-[#1E201E] focus:outline-none focus:ring-2 focus:ring-[#00685F] focus:bg-white shadow-xs cursor-pointer"
                                                        value={currentFlavorId}
                                                        onChange={(e) => {
                                                            const newId = Number(e.target.value);
                                                            setFreeGiftFlavorIds((prev) => {
                                                                const next = [...prev];
                                                                next[idx] = newId;
                                                                return next;
                                                            });
                                                        }}
                                                    >
                                                        {sabores.filter((s) => s.stock_activo).map((s) => (
                                                            <option key={s.id} value={s.id}>
                                                                {s.nombre} {s.es_premium ? `⭐ (Premium +S/ ${Number(s.precio_adicional).toFixed(2)})` : '• Cortesía de la casa (Gratis)'}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-[#FFE8D6] text-[#E65100] font-bold text-xs flex items-center justify-center gap-1.5 border border-amber-200 shrink-0">
                                                    <span className="material-symbols-outlined text-[16px]">celebration</span>
                                                    <span>Gratis</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Aviso amigable cuando ya no aplica cortesía por tener historial */}
                        {isFirstPurchase === false && (
                            <div className="bg-gradient-to-r from-amber-50/90 via-white to-amber-50/60 rounded-3xl p-5 border border-amber-200 shadow-sm flex items-start gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
                                    <span className="material-symbols-outlined text-[22px]">loyalty</span>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-display font-bold text-sm text-[#1E201E]">
                                            ¡Hola de nuevo! Cliente Loreanne Frecuente
                                        </h4>
                                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                                            DNI: {custDni}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#555A58] leading-relaxed">
                                        Detectamos pedidos anteriores asociados a tu DNI. Recuerda que el marciano de cortesía aplica como promoción exclusiva para <strong>primeras compras</strong>. ¡Tu pack incluye todos tus sabores elegidos listos para congelar y disfrutar!
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* 4. Add-ons Accordion */}
                        {/* <div className="bg-white rounded-3xl border border-[#E2DDD6]/80 shadow-sm overflow-hidden">
                            <button
                                className="w-full p-5 flex items-center justify-between text-left hover:bg-[#F3EFEA]/40 transition-colors"
                                onClick={() => setAddonsOpen(!addonsOpen)}
                            >
                                <div className="flex items-center gap-2.5">
                                    <span className="w-7 h-7 rounded-full bg-[#F3EFEA] text-[#1E201E] flex items-center justify-center font-display font-bold text-xs">
                                        4
                                    </span>
                                    <div>
                                        <h3 className="font-display font-bold text-base text-[#1E201E]">
                                            ¿Deseas adicionales gourmet?
                                        </h3>
                                        <p className="text-xs text-[#555A58]">
                                            Hielo seco para traslado, bolsa térmica o dedicatoria
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {activeAddonsCount > 0 && (
                                        <span className="px-2 py-0.5 rounded-full bg-[#E0F5F2] text-[#00685F] text-[10px] font-bold">
                                            {activeAddonsCount} SELECCIONADO{activeAddonsCount > 1 ? 'S' : ''}
                                        </span>
                                    )}
                                    <span className="material-symbols-outlined text-[#555A58] transition-transform">
                                        {addonsOpen ? 'expand_less' : 'expand_more'}
                                    </span>
                                </div>
                            </button>

                            {addonsOpen && (
                                <div className="p-5 pt-0 border-t border-[#E2DDD6]/60 space-y-3">
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#F3EFEA]/60 border border-[#E2DDD6]/60">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={addonIce}
                                                onChange={(e) => setAddonIce(e.target.checked)}
                                                className="w-4 h-4 rounded text-[#00685F] focus:ring-[#00685F] border-[#E2DDD6]"
                                            />
                                            <div>
                                                <div className="text-xs font-bold text-[#1E201E]">
                                                    Hielo seco reutilizable
                                                </div>
                                                <div className="text-[11px] text-[#555A58]">
                                                    Mantiene ultra congelado hasta por 4 horas de traslado
                                                </div>
                                            </div>
                                        </label>
                                        <span className="text-xs font-bold text-[#88512C]">+S/ 3.50</span>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#F3EFEA]/60 border border-[#E2DDD6]/60">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={addonBox}
                                                onChange={(e) => setAddonBox(e.target.checked)}
                                                className="w-4 h-4 rounded text-[#00685F] focus:ring-[#00685F] border-[#E2DDD6]"
                                            />
                                            <div>
                                                <div className="text-xs font-bold text-[#1E201E]">
                                                    Caja térmica coleccionable
                                                </div>
                                                <div className="text-[11px] text-[#555A58]">
                                                    Empaque de regalo hermético de diseño artesanal
                                                </div>
                                            </div>
                                        </label>
                                        <span className="text-xs font-bold text-[#88512C]">+S/ 5.00</span>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#F3EFEA]/60 border border-[#E2DDD6]/60">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={addonCard}
                                                onChange={(e) => setAddonCard(e.target.checked)}
                                                className="w-4 h-4 rounded text-[#00685F] focus:ring-[#00685F] border-[#E2DDD6]"
                                            />
                                            <div>
                                                <div className="text-xs font-bold text-[#1E201E]">
                                                    Tarjeta personalizada con dedicatoria
                                                </div>
                                                <div className="text-[11px] text-[#555A58]">
                                                    Escribe tu mensaje en las notas de entrega
                                                </div>
                                            </div>
                                        </label>
                                        <span className="text-xs font-bold text-[#00685F]">GRATIS</span>
                                    </div>
                                </div>
                            )}
                        </div> */}
                    </section>

                    {/* RIGHT COLUMN: Sticky Order Dock */}
                    <aside className="lg:col-span-5 xl:col-span-4 sticky top-20">
                        <div className="bg-white rounded-3xl border border-[#E2DDD6]/80 shadow-sticky p-5 sm:p-6 space-y-5">
                            {/* Live Cart Header */}
                            <div className="flex items-center justify-between pb-3 border-b border-[#E2DDD6]/70 bg-[#00685F] rounded-md p-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-[#00685F]/10 text-white flex items-center justify-center font-bold text-xs">
                                        <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                                    </div>
                                    <div>
                                        <h3 className="font-display font-bold text-base text-white leading-none">
                                            Resumen de pedido
                                        </h3>
                                        <span className="text-[11px] text-white">Calculado tu conbinación</span>
                                    </div>
                                </div>
                                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-[#00685F] font-bold text-xs border border-emerald-200">
                                    {totalSelectedFlavorsCount} / {totalTargetFlavors} marcianos
                                </span>
                            </div>

                            {/* Itemized Flavors Breakdown */}
                            <div className="space-y-3">
                                <div className="text-xs font-bold uppercase tracking-wider text-[#555A58] flex items-center justify-between">
                                    <span>Resumen de sabores</span>
                                    {totalFreeGiftsCount > 0 && (
                                        <span className="text-[#E65100] font-bold text-[11px]">
                                            +🎁 {totalFreeGiftsCount} de cortesía
                                        </span>
                                    )}
                                    {isFirstPurchase === false && (
                                        <span className="text-amber-850 font-semibold text-[10px] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-amber-800">
                                            Cortesía solo 1ra compra
                                        </span>
                                    )}
                                </div>

                                <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1 text-xs">
                                    {/* Packs listed */}
                                    {Object.entries(packQuantities).map(([packIdStr, qty]) => {
                                        if (qty <= 0) return null;
                                        const p = packs.find((item) => item.id === Number(packIdStr));
                                        if (!p) return null;
                                        return (
                                            <div
                                                key={`pack-${p.id}`}
                                                className="flex items-center justify-between p-2 rounded-xl bg-[#F3EFEA]/70 font-semibold text-[#1E201E]"
                                            >
                                                <span>{qty}x {p.nombre}</span>
                                                <span>S/ {(Number(p.precio) * qty).toFixed(2)}</span>
                                            </div>
                                        );
                                    })}

                                    {/* Selected flavors */}
                                    {Object.entries(selectedFlavors).map(([sIdStr, qty]) => {
                                        if (qty <= 0) return null;
                                        const s = sabores.find((item) => item.id === Number(sIdStr));
                                        if (!s) return null;
                                        const extra = s.es_premium ? Number(s.precio_adicional) * qty : 0;
                                        return (
                                            <div
                                                key={`sabor-${s.id}`}
                                                className="flex items-center justify-between py-1 px-2 text-[#555A58] hover:text-[#1E201E]"
                                            >
                                                <span className="flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#00685F]"></span>
                                                    {qty}x {s.nombre}
                                                </span>
                                                <span>
                                                    {extra > 0 ? `+S/ ${extra.toFixed(2)}` : 'incl.'}
                                                </span>
                                            </div>
                                        );
                                    })}

                                    {/* Courtesy gift flavors itemized */}
                                    {giftSummary.map((g, idx) => (
                                        <div
                                            key={`gift-summary-${g.sabor.id}-${idx}`}
                                            className="flex items-center justify-between py-1.5 px-2 rounded-xl bg-amber-50/80 border border-amber-200/60 text-[#E65100] font-medium text-xs"
                                        >
                                            <span className="flex items-center gap-1.5 truncate mr-2">
                                                <span className="material-symbols-outlined text-[15px] text-[#E65100] shrink-0">
                                                    featured_seasonal_and_gifts
                                                </span>
                                                <span className="truncate">{g.count}x {g.sabor.nombre} (Cortesía)</span>
                                            </span>
                                            <span className="font-bold text-[11px] uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md shrink-0">
                                                {g.sabor.es_premium ? `+S/ ${(Number(g.sabor.precio_adicional) * g.count).toFixed(2)}` : 'Gratis'}
                                            </span>
                                        </div>
                                    ))}

                                    {totalSelectedFlavorsCount === 0 && (
                                        <div className="text-[11px] text-[#555A58] italic py-1 px-2">
                                            Aún no seleccionas sabores para tu pack.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Customer Delivery Form */}
                            <div id="datos-entrega" className="space-y-3 pt-3 border-t border-[#E2DDD6]/70">
                                <div className="text-xs font-bold uppercase tracking-wider text-white bg-[#00685F] p-4 rounded-md  flex gap-2 items-center">
                                    <span className="material-symbols-outlined">hand_package</span>
                                    Datos para tu entrega
                                </div>

                                <div className="space-y-2">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-[#555A58] mb-1">
                                            Método de recepción
                                        </label>
                                        <select
                                            value={deliveryMethod}
                                            onChange={(e) => setDeliveryMethod(e.target.value as any)}
                                            className="w-full h-10 px-3 rounded-xl bg-[#F3EFEA]/70 border border-[#E2DDD6] text-xs text-[#1E201E] focus:outline-none focus:ring-1 focus:ring-[#00685F] font-medium"
                                        >
                                            <option value="delivery">🛵 Delivery Express (Lima y Distritos)</option>
                                            <option value="pickup">🏬 Recojo en tienda (Los Olivos - Gratis)</option>
                                        </select>
                                    </div>

                                    {deliveryMethod === 'delivery' && (
                                        <div>
                                            <label className="block text-[11px] font-semibold text-[#555A58] mb-1">
                                                Distrito / Zona de Entrega *
                                            </label>
                                            <select
                                                value={selectedZonaId}
                                                onChange={(e) => setSelectedZonaId(Number(e.target.value))}
                                                className="w-full h-10 px-3 rounded-xl bg-[#F3EFEA]/70 border border-[#E2DDD6] text-xs text-[#1E201E] focus:outline-none focus:ring-1 focus:ring-[#00685F] font-medium"
                                            >
                                                {zonasEnvio.map((zona) => (
                                                    <option key={zona.id} value={zona.id}>
                                                        {zona.nombre} — S/ {Number(zona.precio).toFixed(2)}{zona.tiempo_estimado ? ` (${zona.tiempo_estimado})` : ''}
                                                    </option>
                                                ))}
                                                {zonasEnvio.length === 0 && (
                                                    <option value="1">Lima Metropolitana — S/ 8.00</option>
                                                )}
                                            </select>
                                        </div>
                                    )}

                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="block text-[11px] font-semibold text-[#555A58]">
                                                DNI (8 dígitos) *
                                            </label>
                                            {isCheckingDni && (
                                                <span className="text-[10px] text-[#00685F] flex items-center gap-1 font-medium animate-pulse">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#00685F]"></span> Validando...
                                                </span>
                                            )}
                                            {isFirstPurchase === true && (
                                                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                                                    🎁 1ra Compra: Cortesía activa
                                                </span>
                                            )}
                                            {isFirstPurchase === false && (
                                                <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full font-bold border border-amber-200">
                                                    Cliente frecuente
                                                </span>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={8}
                                                required
                                                value={custDni}
                                                onChange={(e) => handleDniChange(e.target.value)}
                                                placeholder="Ej. 72345678"
                                                className={`w-full h-9 px-3 rounded-xl bg-[#F3EFEA]/70 border text-xs text-[#1E201E] focus:outline-none focus:ring-1 ${
                                                    isFirstPurchase === false
                                                        ? 'border-amber-300 focus:ring-amber-500'
                                                        : isFirstPurchase === true
                                                        ? 'border-emerald-300 focus:ring-emerald-500'
                                                        : 'border-[#E2DDD6] focus:ring-[#00685F]'
                                                }`}
                                            />
                                        </div>
                                        {dniFeedback && (
                                            <p className={`text-[10px] mt-1 leading-tight ${isFirstPurchase === false ? 'text-amber-800' : isFirstPurchase === true ? 'text-emerald-700 font-medium' : 'text-[#555A58]'}`}>
                                                {dniFeedback}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-semibold text-[#555A58] mb-1">
                                            Nombre Completo *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={custName}
                                            onChange={(e) => setCustName(e.target.value)}
                                            placeholder="Tu nombre completo"
                                            className="w-full h-9 px-3 rounded-xl bg-[#F3EFEA]/70 border border-[#E2DDD6] text-xs text-[#1E201E] focus:outline-none focus:ring-1 focus:ring-[#00685F]"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[11px] font-semibold text-[#555A58] mb-1">
                                                WhatsApp *
                                            </label>
                                            <input
                                                type="tel"
                                                required
                                                value={custPhone}
                                                onChange={(e) => setCustPhone(e.target.value)}
                                                placeholder="999 999 999"
                                                className="w-full h-9 px-3 rounded-xl bg-[#F3EFEA]/70 border border-[#E2DDD6] text-xs text-[#1E201E] focus:outline-none focus:ring-1 focus:ring-[#00685F]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-semibold text-[#555A58] mb-1">
                                                Nº Respaldo (opcional)
                                            </label>
                                            <input
                                                type="tel"
                                                value={custBackupPhone}
                                                onChange={(e) => setCustBackupPhone(e.target.value)}
                                                placeholder="999 999 999"
                                                className="w-full h-9 px-3 rounded-xl bg-[#F3EFEA]/70 border border-[#E2DDD6] text-xs text-[#1E201E] focus:outline-none focus:ring-1 focus:ring-[#00685F]"
                                            />
                                        </div>
                                    </div>

                                    {deliveryMethod === 'delivery' && (
                                        <div>
                                            <label className="block text-[11px] font-semibold text-[#555A58] mb-1">
                                                Dirección / Referencia *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={custAddress}
                                                onChange={(e) => setCustAddress(e.target.value)}
                                                placeholder="Ej. Av. Larco 1234, Dpto 501"
                                                className="w-full h-9 px-3 rounded-xl bg-[#F3EFEA]/70 border border-[#E2DDD6] text-xs text-[#1E201E] focus:outline-none focus:ring-1 focus:ring-[#00685F]"
                                            />
                                        </div>
                                    )}

                                    <details className="text-[11px] text-[#555A58]">
                                        <summary className="cursor-pointer hover:text-[#1E201E] font-semibold pt-1">
                                            ¿Tienes un saldo a favor o compensación anterior?
                                        </summary>
                                        <div className="pt-2">
                                            <textarea
                                                rows={2}
                                                value={custNotes}
                                                onChange={(e) => setCustNotes(e.target.value)}
                                                placeholder="Describe aquí tu saldo a fvor o compensación anterior"
                                                className="w-full p-2.5 rounded-xl bg-[#F3EFEA]/70 border border-[#E2DDD6] text-xs text-[#1E201E] focus:outline-none focus:ring-1 focus:ring-[#00685F]"
                                            />
                                        </div>
                                    </details>
                                </div>
                            </div>

                            {/* Total Calculation Breakdown */}
                            <div className="space-y-2 pt-3 border-t border-[#E2DDD6]/70 bg-[#F3EFEA]/40 -mx-5 -mb-5 p-5 rounded-b-3xl">
                                <div className="space-y-1 text-xs text-[#555A58]">
                                    <div className="flex justify-between">
                                        <span>Subtotal Packs:</span>
                                        <span className="font-medium text-[#1E201E]">
                                            S/ {packsSubtotal.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Sabores Premium extra:</span>
                                        <span className="font-medium text-[#1E201E]">
                                            S/ {premiumSurcharge.toFixed(2)}
                                        </span>
                                    </div>
                                    {/* <div className="flex justify-between">
                                        <span>Adicionales & Empaque:</span>
                                        <span className="font-medium text-[#1E201E]">
                                            S/ {addonsTotal.toFixed(2)}
                                        </span>
                                    </div> */}
                                    <div className="flex justify-between">
                                        <span>Costo de Envío:</span>
                                        <span className="font-medium text-[#1E201E]">
                                            {deliveryCost > 0
                                                ? `S/ ${deliveryCost.toFixed(2)}${selectedZona ? ` (${selectedZona.nombre})` : ''}`
                                                : 'Gratis'}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-[#E2DDD6] flex items-baseline justify-between">
                                    <span className="font-display font-bold text-sm text-[#1E201E]">
                                        Total Final
                                    </span>
                                    <div className="text-right">
                                        <span className="font-display font-extrabold text-2xl text-[#E65100]">
                                            S/ {grandTotal.toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <button
                                        disabled={isSubmitting}
                                        onClick={handleCheckout}
                                        className="w-full bg-[#25D366] hover:bg-[#1EBE5B] active:scale-[0.98] text-white font-display font-extrabold text-sm py-3.5 px-4 rounded-2xl shadow-lg hover:shadow-emerald-500/20 flex items-center justify-center gap-2.5 transition-all uppercase tracking-wide cursor-pointer disabled:opacity-70"
                                    >
                                        <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                                            <path d="M12.031 2C6.496 2 2 6.494 2 12.029c0 1.768.46 3.497 1.336 5.02L2 22l5.121-1.343c1.472.802 3.13 1.228 4.91 1.228h.005c5.534 0 10.029-4.494 10.029-10.03 0-2.678-1.043-5.197-2.936-7.091A9.972 9.972 0 0 0 12.031 2zm0 18.334h-.004c-1.503 0-2.977-.404-4.264-1.168l-.306-.182-3.167.831.846-3.087-.2-.317a8.315 8.315 0 0 1-1.272-4.382c0-4.61 3.75-8.36 8.367-8.36 2.234 0 4.333.87 5.912 2.45a8.312 8.312 0 0 1 2.45 5.914c0 4.61-3.75 8.36-8.366 8.36zm4.586-6.262c-.251-.126-1.488-.734-1.719-.817-.23-.084-.398-.126-.566.126-.168.252-.65 8.17-.797.985-.147.168-.293.189-.544.063s-1.06-.391-2.02-1.246c-.747-.666-1.251-1.489-1.398-1.74-.147-.252-.016-.388.11-.513.113-.113.251-.293.377-.44.126-.147.168-.252.251-.419.084-.168.042-.315-.021-.44-.063-.126-.566-1.363-.775-1.867-.204-.49-.411-.424-.566-.432-.147-.008-.315-.01-.482-.01s-.44.063-.67.315c-.23.252-.88 8.6-.88 2.097 0 1.238.901 2.434 1.026 2.602.126.168 1.772 2.705 4.293 3.793.6.259 1.069.414 1.435.53.603.192 1.152.165 1.586.1.484-.072 1.488-.608 1.697-1.196.21-.588.21-1.092.147-1.196-.063-.105-.23-.168-.482-.294z"></path>
                                        </svg>
                                        <span>
                                            {isSubmitting ? 'GENERANDO PEDIDO...' : `ENVIAR PEDIDO (S/ ${grandTotal.toFixed(2)})`}
                                        </span>
                                    </button>
                                    <p className="text-center text-[10px] text-[#555A58] pt-2 flex items-center justify-center gap-1">
                                        <span className="material-symbols-outlined text-[13px] text-[#00685F]">
                                            verified_user
                                        </span>
                                        <span>Envío automático con detalle a nuestro WhatsApp oficial</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>

            {/* ORDER CONFIRMATION MODAL */}
            {orderSuccess && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#E2DDD6] space-y-5 text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#00685F] mx-auto flex items-center justify-center shadow-xs">
                            <span className="material-symbols-outlined text-4xl">check_circle</span>
                        </div>

                        <div>
                            <span className="text-xs font-bold text-[#00685F] uppercase tracking-wider">
                                ¡Pedido Registrado con Éxito!
                            </span>
                            <h3 className="font-display font-extrabold text-2xl text-[#1E201E] mt-1">
                                Orden #{orderSuccess.codigo_orden}
                            </h3>
                            <p className="text-xs text-[#555A58] mt-2">
                                Se ha generado tu orden por un total de{' '}
                                <strong className="text-[#88512C]">S/ {orderSuccess.total}</strong>.
                                Hemos intentado abrir WhatsApp para que envíes los detalles a nuestro asesor.
                            </p>
                        </div>

                        <div className="space-y-2 pt-2">
                            <a
                                href={orderSuccess.whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full bg-[#25D366] hover:bg-[#1EBE5B] text-white font-display font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-md transition-all"
                            >
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                    <path d="M12.031 2C6.496 2 2 6.494 2 12.029c0 1.768.46 3.497 1.336 5.02L2 22l5.121-1.343c1.472.802 3.13 1.228 4.91 1.228h.005c5.534 0 10.029-4.494 10.029-10.03 0-2.678-1.043-5.197-2.936-7.091A9.972 9.972 0 0 0 12.031 2zm0 18.334h-.004c-1.503 0-2.977-.404-4.264-1.168l-.306-.182-3.167.831.846-3.087-.2-.317a8.315 8.315 0 0 1-1.272-4.382c0-4.61 3.75-8.36 8.367-8.36 2.234 0 4.333.87 5.912 2.45a8.312 8.312 0 0 1 2.45 5.914c0 4.61-3.75 8.36-8.366 8.36zm4.586-6.262c-.251-.126-1.488-.734-1.719-.817-.23-.084-.398-.126-.566.126-.168.252-.65 8.17-.797.985-.147.168-.293.189-.544.063s-1.06-.391-2.02-1.246c-.747-.666-1.251-1.489-1.398-1.74-.147-.252-.016-.388.11-.513.113-.113.251-.293.377-.44.126-.147.168-.252.251-.419.084-.168.042-.315-.021-.44-.063-.126-.566-1.363-.775-1.867-.204-.49-.411-.424-.566-.432-.147-.008-.315-.01-.482-.01s-.44.063-.67.315c-.23.252-.88 8.6-.88 2.097 0 1.238.901 2.434 1.026 2.602.126.168 1.772 2.705 4.293 3.793.6.259 1.069.414 1.435.53.603.192 1.152.165 1.586.1.484-.072 1.488-.608 1.697-1.196.21-.588.21-1.092.147-1.196-.063-.105-.23-.168-.482-.294z"></path>
                                </svg>
                                <span>Abrir WhatsApp Ahora</span>
                            </a>

                            <button
                                onClick={() => setOrderSuccess(null)}
                                className="w-full py-2.5 px-4 text-xs font-bold text-[#555A58] hover:text-[#1E201E]"
                            >
                                Cerrar y armar otro pack
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* FOOTER */}
            <footer className="mt-12 bg-[#F3EFEA] border-t border-[#E2DDD6]/80 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#555A58]">
                    <div className="flex items-center gap-2.5">
                        <img
                            alt="Loreanne Logo"
                            className="h-8 w-8 object-contain rounded-full border border-[#E2DDD6] bg-white p-0.5 opacity-90"
                            src={LOGO_URL}
                        />
                        <span>© 2026 Loreanne • Arma tu Pack • Calidad Gourmet y Fruta 100% Peruana</span>
                    </div>
                    <div className="flex items-center gap-4 font-medium">
                        <a className="hover:text-[#1E201E] transition-colors" href="#">
                            Términos de Envío
                        </a>
                       
                        <a
                            className="hover:text-[#1E201E] transition-colors"
                            href={`https://wa.me/${cleanPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Atención al Cliente
                        </a>
                         <a className="hover:text-[#1E201E] transition-colors" href="https://reactive.pe" target="_blank" rel="noopener noreferrer">
                            Developed by Reactive <strong></strong>
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
