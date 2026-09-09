/**
 * Roma Capital — Cartas Contempladas.
 * Dados via proxy same-origin /api/cartas (a API Key fica só no servidor).
 * Consome o mesmo backend do sistema Invest Master.
 */

const RC_API_CARTAS = "/api/cartas";
const RC_WHATSAPP_E164 = "5547988751429";

function rcBuildWaMeUrl(text) {
    return "https://wa.me/" + RC_WHATSAPP_E164 + "?text=" + encodeURIComponent(text);
}

let cartasData = [];
let cartasOriginalOrder = [];

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
});
const numberFormatter = new Intl.NumberFormat("pt-BR");
// Valor sem símbolo de moeda (ex.: "1.500,00") para o Excel tratar como número.
const decimalFormatter = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

const adminLogos = {
    Embracon: {
        src: "/assets/img/parceiras/embracon.svg",
        alt: "Logo Embracon Consórcio Nacional",
        aliases: ["embracon", "embraconconsorcio", "embraconconsorcios"]
    },
    Bradesco: {
        src: "/assets/img/parceiras/bradesco.webp",
        alt: "Logo Bradesco Consórcios",
        aliases: ["bradesco", "bradescoconsorcio", "bradescoconsorcios"]
    },
    Volkswagen: {
        src: "/assets/img/parceiras/volkswagen.svg",
        alt: "Logo Consórcio Nacional Volkswagen",
        aliases: ["volkswagen", "volkswagem", "volks", "vw", "consorciovw", "vwconsorcio", "consorcionacionalvolkswagen"]
    }
};

const state = {
    search: "",
    term: "all",
    entryRange: "all",
    sort: "credit-desc",
    apiStatus: "all",
    apiTipo: "all",
    statusVisible: { disponivel: true, reservada: true, vendida: false },
    selectedIds: new Set(),
    loading: false,
    loadError: ""
};

const publicLoadErrorTitle = "Estamos com instabilidade momentânea";
const publicLoadErrorDetail = "Não foi possível carregar as cartas agora. Tente novamente em instantes.";

const elements = {
    search: document.getElementById("rc-search"),
    status: document.getElementById("rc-status-filter"),
    typeButtons: Array.from(document.querySelectorAll(".rc-type-btn")),
    term: document.getElementById("rc-term-filter"),
    entry: document.getElementById("rc-entry-filter"),
    sort: document.getElementById("rc-sort-filter"),
    reset: document.getElementById("rc-reset-filters"),
    exportExcel: document.getElementById("rc-export-excel"),
    exportPdf: document.getElementById("rc-export-pdf"),
    tableShell: document.querySelector(".rc-table-shell"),
    tableBody: document.getElementById("rc-table-body"),
    cardsGrid: document.getElementById("rc-cards-grid"),
    emptyState: document.getElementById("rc-empty-state"),
    emptyTitle: document.getElementById("rc-empty-title"),
    emptyDetail: document.getElementById("rc-empty-detail"),
    retryCartas: document.getElementById("rc-retry-cartas"),
    results: document.getElementById("rc-results-status"),
    selectionPanel: document.getElementById("rc-selection-panel"),
    selectionCount: document.getElementById("rc-selection-count"),
    selectionAdmin: document.getElementById("rc-selection-admin"),
    selectionCredit: document.getElementById("rc-selection-credit"),
    selectionEntry: document.getElementById("rc-selection-entry"),
    selectionBalance: document.getElementById("rc-selection-balance"),
    selectionFeeMetric: document.getElementById("rc-selection-fee-metric"),
    selectionFee: document.getElementById("rc-selection-fee"),
    selectionTerm: document.getElementById("rc-selection-term"),
    selectionPhases: document.getElementById("rc-selection-phases"),
    selectionPhasesList: document.getElementById("rc-selection-phases-list"),
    selectionPreview: document.getElementById("rc-selection-preview"),
    selectionNegotiate: document.getElementById("rc-selection-negotiate"),
    selectionClear: document.getElementById("rc-selection-clear"),
    detailModal: document.getElementById("rc-detail-modal"),
    detailModalDialog: document.querySelector("#rc-detail-modal .rc-modal__dialog"),
    detailModalClose: document.getElementById("rc-detail-modal-close"),
    detailVendida: document.getElementById("rc-detail-vendida"),
    detailNegotiation: document.getElementById("rc-detail-negotiation"),
    detailWhatsapp: document.getElementById("rc-detail-whatsapp"),
    propostaModal: document.getElementById("rc-proposta-modal"),
    propostaModalDialog: document.querySelector("#rc-proposta-modal .rc-modal__dialog"),
    propostaModalClose: document.getElementById("rc-proposta-modal-close"),
    propostaWhatsapp: document.getElementById("rc-proposta-whatsapp")
};

/* ------------------------------------------------------------------ *
 * Normalização dos dados vindos da API
 * ------------------------------------------------------------------ */

function extractCartasArray(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.cartas)) return payload.cartas;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.results)) return payload.results;
    return [];
}

function parseReaisToCents(value) {
    if (value == null || value === "") return 0;
    if (typeof value === "string") {
        const t = value.trim().replace(/[^\d,.-]/g, "");
        if (!t) return 0;
        const normalized = t.includes(",")
            ? t.replace(/\./g, "").replace(",", ".")
            : /^\d{1,3}(\.\d{3})+$/.test(t)
              ? t.replace(/\./g, "")
              : t;
        const n = Number(normalized);
        return Number.isFinite(n) ? Math.round(n * 100) : 0;
    }
    const n = Number(value);
    return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

function pickCents(raw, base) {
    const centKey = base + "Centavos";
    if (raw[centKey] != null && raw[centKey] !== "") {
        const n = Math.round(Number(raw[centKey]));
        return Number.isFinite(n) ? n : 0;
    }
    return parseReaisToCents(raw[base]);
}

function normalizeTipoKey(raw) {
    const t = String(raw || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");
    if (t.includes("imovel") || t === "imóvel") return "imovel";
    if (t.includes("veiculo") || t.includes("veículo")) return "veiculo";
    if (t.includes("servico") || t.includes("serviço")) return "servico";
    return "outro";
}

function normalizeProductInternal(tipoKey) {
    if (tipoKey === "imovel") return "Imovel";
    if (tipoKey === "veiculo") return "Veiculo";
    if (tipoKey === "servico") return "Servico";
    return "Outro";
}

function normalizeStatusKey(raw) {
    const t = String(raw || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");
    if (t.includes("dispon")) return "disponivel";
    if (t.includes("reserv")) return "reservada";
    if (t.includes("vend")) return "vendida";
    return "outro";
}

function statusLabel(key) {
    switch (key) {
        case "disponivel": return "Disponível";
        case "reservada":  return "Reservada";
        case "vendida":    return "Vendida";
        default:           return "Outro";
    }
}

function statusPillClass(key) {
    if (key === "disponivel") return "is-disponivel";
    if (key === "reservada") return "is-reservada";
    if (key === "vendida") return "is-vendida";
    return "is-outro";
}

function isProposalBlocked(row) {
    return row && row.statusKey === "reservada";
}

function firstDefined(raw, keys) {
    for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        if (raw[k] != null && raw[k] !== "") {
            return raw[k];
        }
    }
    return null;
}

function parsePercentLoose(value) {
    if (value == null || value === "") return null;
    if (typeof value === "number" && Number.isFinite(value)) {
        if (value > 0 && value <= 1) return value * 100;
        return value;
    }
    const s = String(value).trim().replace(/\s/g, "").replace(/%/g, "");
    if (!s) return null;
    const normalized = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s.replace(",", ".");
    const n = Number(normalized);
    if (!Number.isFinite(n)) return null;
    if (n > 0 && n <= 1) return n * 100;
    return n;
}

function formatPercentBrFromNumber(n, fractionDigits) {
    if (n == null || !Number.isFinite(n)) return "—";
    const fd = typeof fractionDigits === "number" ? fractionDigits : 2;
    return (
        new Intl.NumberFormat("pt-BR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: fd
        }).format(n) + "%"
    );
}

function formatDateBr(value) {
    if (value == null || value === "") return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function padIntDisplay(value, width) {
    const n = Math.round(Number(value));
    if (!Number.isFinite(n) || n < 0) return "—";
    return String(n).padStart(width, "0");
}

function parseJsonMaybe(value) {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    if (!trimmed || (!trimmed.startsWith("[") && !trimmed.startsWith("{"))) return value;
    try {
        return JSON.parse(trimmed);
    } catch {
        return value;
    }
}

function splitPhaseLabel(value) {
    const label = String(value || "").trim();
    if (!label) return [];
    const parts = label.split(/\s*(?:\+|\be\b|;|\n)\s*/i).map((part) => part.trim()).filter(Boolean);
    if (parts.length > 1 && parts.every((part) => /\d+\s*x/i.test(part))) return parts;
    return [label];
}

function asPhaseArray(value) {
    const parsed = parseJsonMaybe(value);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object") {
        if (Array.isArray(parsed.fases)) return parsed.fases;
        if (Array.isArray(parsed.items)) return parsed.items;
        return [parsed];
    }
    if (typeof parsed === "string" && parsed.trim()) return splitPhaseLabel(parsed);
    return [];
}

function parsePositiveInteger(value) {
    if (value == null || value === "") return 0;
    const match = String(value).match(/\d+/);
    if (!match) return 0;
    const n = Math.round(Number(match[0]));
    return Number.isFinite(n) && n > 0 ? n : 0;
}

function pickPhaseCount(phase) {
    if (!phase || typeof phase !== "object") {
        const match = String(phase || "").match(/(\d+)\s*x/i);
        return match ? parsePositiveInteger(match[1]) : 0;
    }
    return parsePositiveInteger(
        firstDefined(phase, [
            "parcelas", "quantidade", "quantidadeParcelas", "qtd", "qtdParcelas",
            "numeroParcelas", "nParcelas", "prazo", "meses", "count"
        ])
    );
}

function pickPhaseAmountCents(phase) {
    if (!phase || typeof phase !== "object") return 0;
    const cents = firstDefined(phase, ["valorParcelaCentavos", "valorCentavos", "parcelaCentavos", "amountCents"]);
    if (cents != null) {
        const n = Math.round(Number(cents));
        return Number.isFinite(n) ? n : 0;
    }
    return parseReaisToCents(firstDefined(phase, ["valorParcela", "valor", "parcela", "valorMensal", "valorMes", "valor_mes", "amount"]));
}

function normalizeInstallmentPhases(raw, fallbackCount, fallbackAmountCents) {
    const phaseSource = firstDefined(raw, [
        "parcelasFases", "parcelas_fases", "parcelasFasesTexto", "parcelas_fases_texto",
        "parcelasFasesLabel", "parcelas_fases_label", "parcelasResumo", "parcelas_resumo",
        "parcelasDescricao", "parcelas_descricao", "resumoParcelas", "resumo_parcelas",
        "parcelasPorFase", "parcelas_por_fase", "fasesParcelas", "fases_parcelas", "fases",
        "parcelamento", "parcelamentoFases", "parcelamento_fases", "planoParcelas",
        "planoParcelasTexto", "plano_parcelas_texto"
    ]);
    let rawPhases = asPhaseArray(phaseSource);

    if (!rawPhases.length && typeof raw.parcelas === "string" && /\d+\s*x/i.test(raw.parcelas)) {
        rawPhases = asPhaseArray(raw.parcelas);
    }
    if (!rawPhases.length && Array.isArray(raw.parcelas)) {
        rawPhases = raw.parcelas;
    }
    if (!rawPhases.length && raw.parcelas && typeof raw.parcelas === "object") {
        rawPhases = asPhaseArray(raw.parcelas);
    }
    if (!rawPhases.length) {
        rawPhases = asPhaseArray(
            firstDefined(raw, ["descricaoParcelas", "descricao_parcelas", "textoParcelas", "texto_parcelas"])
        );
    }

    const phases = rawPhases
        .map((phase) => {
            if (typeof phase === "string") {
                const label = phase.trim();
                return label ? { count: pickPhaseCount(label), amountCents: 0, label } : null;
            }
            const count = pickPhaseCount(phase);
            const amountCents = pickPhaseAmountCents(phase);
            const customLabel = firstDefined(phase || {}, ["label", "descricao", "descrição", "texto", "description"]);
            const label =
                count > 0 && amountCents > 0
                    ? numberFormatter.format(count) + "x " + formatCurrencyFromCents(amountCents)
                    : customLabel
                      ? String(customLabel).trim()
                      : "";
            return label ? { count, amountCents, label } : null;
        })
        .filter(Boolean);

    if (phases.length) return phases;

    if (fallbackCount > 0 && fallbackAmountCents > 0) {
        return [{
            count: fallbackCount,
            amountCents: fallbackAmountCents,
            label: numberFormatter.format(fallbackCount) + "x " + formatCurrencyFromCents(fallbackAmountCents)
        }];
    }
    return [];
}

function mapApiCard(raw) {
    const grupo = Number(raw.grupoNumero ?? raw.grupo ?? 0) || 0;
    const cotaRaw = firstDefined(raw, ["cotaNumero", "cota", "cota_numero"]);
    const cota = cotaRaw != null ? String(cotaRaw) : "";
    const id = String(raw.id || raw.numero || `g${grupo}${cota ? "-c" + cota : ""}`);
    const tipoKey = normalizeTipoKey(raw.tipo);
    const product = normalizeProductInternal(tipoKey);
    const admin = String(raw.administradora || "—").trim() || "—";
    const credit = pickCents(raw, "valor");
    const entry = pickCents(raw, "entrada");
    const baseInstallment = pickCents(raw, "valorParcela");
    const term = Math.round(Number(raw.prazo) || 0);
    const parcelasValue = firstDefined(raw, ["parcelas", "quantidadeParcelas", "qtdParcelas"]);
    const parcelas = Array.isArray(parcelasValue) ? 0 : Math.round(Number(parcelasValue) || 0);

    let balance = 0;
    if (raw.saldoCentavos != null && raw.saldoCentavos !== "") {
        const n = Math.round(Number(raw.saldoCentavos));
        balance = Number.isFinite(n) ? n : 0;
    } else {
        const v = raw.saldo ?? raw.saldoDevedor ?? raw.saldo_devedor;
        balance = parseReaisToCents(v);
    }
    if (!balance && credit > 0 && raw.saldo == null && raw.saldoDevedor == null && raw.saldo_devedor == null && raw.saldoCentavos == null) {
        balance = Math.max(0, credit - entry);
    }

    const computedEntryPercent = credit > 0 ? (entry / credit) * 100 : 0;
    const apiEntryPercent = parsePercentLoose(firstDefined(raw, ["entradaPercent", "percentualEntrada", "entrada_percent"]));
    const entryPercent = apiEntryPercent != null ? apiEntryPercent : computedEntryPercent;
    const statusKey = normalizeStatusKey(raw.status);

    let whatsappUrl = raw.whatsappUrl;
    if (typeof whatsappUrl === "string") {
        whatsappUrl = whatsappUrl.trim();
        if (!whatsappUrl || whatsappUrl === "null") whatsappUrl = null;
    } else {
        whatsappUrl = null;
    }

    const taxaRawValue = firstDefined(raw, ["taxa", "taxaAdmin", "taxaAdministracao", "taxaAdministrativa", "taxa_admin", "taxa_administrativa"]);
    const taxaReaisCents = parseReaisToCents(taxaRawValue);
    const taxaPt = taxaReaisCents > 0 ? formatCurrencyFromCents(taxaReaisCents) : "—";

    const dataContemplacaoRaw = firstDefined(raw, ["dataContemplacao", "data_contemplacao", "contempladoEm", "contemplado_em"]);
    const dataContemplacaoPt = formatDateBr(dataContemplacaoRaw);

    const vendidoParaName = (() => {
        const v = firstDefined(raw, ["vendidoPara", "compradorNome", "clienteNome", "nomeComprador", "buyerName"]);
        if (v == null || v === "") return "";
        return String(v).trim();
    })();
    const vendidoEmRaw = firstDefined(raw, ["vendidoEm", "dataVenda", "vendido_em", "data_venda"]);
    const vendidoEmPt = formatDateBr(vendidoEmRaw);

    const grupoPadded = padIntDisplay(grupo, 4);
    const cotaTrim = cota.trim();
    let cotaPadded = "—";
    if (cotaTrim) {
        cotaPadded = /^\d+$/.test(cotaTrim) ? padIntDisplay(Number(cotaTrim), 3) : cotaTrim;
    }

    const countLine = parcelas > 0 ? parcelas : term;
    const installmentPhases = normalizeInstallmentPhases(raw, countLine, baseInstallment);
    const installment = installmentPhases.find((phase) => phase.amountCents > 0)?.amountCents || baseInstallment;
    const installmentPhasesText = installmentPhases.length ? installmentPhases.map((phase) => phase.label).join(" + ") : "—";
    const subParcelasText = installmentPhasesText !== "—" ? installmentPhasesText + "/mês" : "—";

    return {
        id,
        numero: raw.numero != null ? String(raw.numero) : id,
        group: grupo,
        grupoNumeroPadded: grupoPadded,
        cotaNumero: cota,
        cotaNumeroPadded: cotaPadded,
        parcelas,
        product,
        tipoKey,
        tipoLabel: formatProductLabel(product),
        admin,
        credit,
        entry,
        balance,
        transferFee: taxaReaisCents,
        installment,
        installmentPhases,
        installmentPhasesText,
        term,
        entryPercent,
        entradaPercentPt: formatPercentBrFromNumber(entryPercent, 2),
        taxaPt,
        dataContemplacaoPt,
        subParcelasText,
        vendidoParaName,
        vendidoEmPt,
        statusKey,
        statusLabel: statusLabel(statusKey),
        whatsappUrl
    };
}

function formatCurrencyFromCents(cents) {
    return currencyFormatter.format(cents / 100);
}

function formatProductLabel(product) {
    if (product === "Imovel") return "Imóvel";
    if (product === "Veiculo") return "Veículo";
    if (product === "Servico") return "Serviço";
    return product;
}

function getAdminLogo(admin) {
    if (!admin) return null;
    if (adminLogos[admin]) return adminLogos[admin];
    const lower = admin.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
    const key = Object.keys(adminLogos).find((k) => {
        const aliases = adminLogos[k].aliases || [k];
        return aliases.some((alias) => {
            const logoKey = alias.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
            return lower === logoKey || lower.includes(logoKey);
        });
    });
    return key ? adminLogos[key] : null;
}

/* ------------------------------------------------------------------ *
 * Busca na API
 * ------------------------------------------------------------------ */

function buildApiQuery() {
    const params = new URLSearchParams();
    if (state.apiStatus && state.apiStatus !== "all") params.set("status", state.apiStatus);
    if (state.apiTipo && state.apiTipo !== "all") params.set("tipo", state.apiTipo);
    const q = params.toString();
    return q ? "?" + q : "";
}

async function fetchCartas() {
    state.loading = true;
    state.loadError = "";
    updateResults(getVisibleRows());
    try {
        const res = await fetch(RC_API_CARTAS + buildApiQuery(), {
            method: "GET",
            headers: { Accept: "application/json" },
            credentials: "same-origin"
        });
        const body = await res.json().catch(() => null);
        if (!res.ok) {
            const msg = (body && (body.message || body.error)) || "Não foi possível carregar as cartas (" + res.status + ").";
            throw new Error(msg);
        }
        const list = extractCartasArray(body);
        cartasData = list.map(mapApiCard);
        cartasOriginalOrder = cartasData.map((r, i) => ({ id: r.id, idx: i }));
        state.selectedIds.clear();
    } catch (err) {
        cartasData = [];
        state.loadError = err && err.message ? err.message : "Erro ao carregar dados.";
        console.warn("[TM Consórcios] Falha ao carregar cartas:", state.loadError);
    } finally {
        state.loading = false;
        render();
    }
}

/* ------------------------------------------------------------------ *
 * Filtro / ordenação
 * ------------------------------------------------------------------ */

function filterRows() {
    const query = state.search.trim().toLowerCase();
    return cartasData.filter((row) => {
        const matchesSearch =
            !query ||
            String(row.group).includes(query) ||
            row.product.toLowerCase().includes(query) ||
            row.admin.toLowerCase().includes(query) ||
            row.numero.toLowerCase().includes(query) ||
            row.statusLabel.toLowerCase().includes(query);

        const matchesTerm =
            state.term === "all" ||
            (state.term === "short" && row.term <= 60) ||
            (state.term === "medium" && row.term >= 61 && row.term <= 120) ||
            (state.term === "long" && row.term >= 121);

        const matchesEntry =
            state.entryRange === "all" ||
            (state.entryRange === "low" && row.entryPercent <= 40) ||
            (state.entryRange === "mid" && row.entryPercent > 40 && row.entryPercent <= 45) ||
            (state.entryRange === "high" && row.entryPercent > 45);

        const matchesStatus = state.statusVisible[row.statusKey] !== false;

        return matchesSearch && matchesTerm && matchesEntry && matchesStatus;
    });
}

function sortRows(rows) {
    if (state.sort === "none") {
        const orderMap = new Map(cartasOriginalOrder.map((o) => [o.id, o.idx]));
        return [...rows].sort((a, b) => (orderMap.get(a.id) ?? 9999) - (orderMap.get(b.id) ?? 9999));
    }
    return [...rows].sort((left, right) => {
        switch (state.sort) {
            case "credit-asc":       return left.credit - right.credit;
            case "credit-desc":      return right.credit - left.credit;
            case "entry-asc":        return left.entry - right.entry;
            case "entry-desc":       return right.entry - left.entry;
            case "term-asc":         return left.term - right.term;
            case "term-desc":        return right.term - left.term;
            case "installment-asc":  return left.installment - right.installment;
            case "installment-desc": return right.installment - left.installment;
            case "admin-asc":        return String(left.admin).localeCompare(String(right.admin), "pt-BR");
            case "admin-desc":       return String(right.admin).localeCompare(String(left.admin), "pt-BR");
            case "product-asc":      return String(left.product).localeCompare(String(right.product), "pt-BR");
            case "product-desc":     return String(right.product).localeCompare(String(left.product), "pt-BR");
            case "status-asc":       return String(left.statusKey).localeCompare(String(right.statusKey), "pt-BR");
            case "status-desc":      return String(right.statusKey).localeCompare(String(left.statusKey), "pt-BR");
            default:                 return 0;
        }
    });
}

function updateSortIndicators() {
    document.querySelectorAll(".rc-desktop-table thead th[data-rc-col]").forEach((th) => {
        const col = th.getAttribute("data-rc-col");
        if (state.sort === col + "-desc") {
            th.setAttribute("data-rc-sort", "desc");
            th.setAttribute("aria-sort", "descending");
        } else if (state.sort === col + "-asc") {
            th.setAttribute("data-rc-sort", "asc");
            th.setAttribute("aria-sort", "ascending");
        } else {
            th.removeAttribute("data-rc-sort");
            th.removeAttribute("aria-sort");
        }
    });
}

function getVisibleRows() {
    return sortRows(filterRows());
}

/* ------------------------------------------------------------------ *
 * Exportação
 * ------------------------------------------------------------------ */

function getExportRows() {
    return getVisibleRows().map((row) => {
        const phases = Array.isArray(row.installmentPhases) ? row.installmentPhases : [];
        const firstPhase = phases[0];
        const qtdParcelasNum = phases.length
            ? phases.reduce((sum, phase) => sum + Math.max(0, Math.round(Number(phase.count) || 0)), 0)
            : Math.max(0, Math.round(Number(row.term) || 0));
        const valorParcelaCents = firstPhase && firstPhase.amountCents
            ? Math.max(0, Math.round(Number(firstPhase.amountCents) || 0))
            : Math.max(0, Math.round(Number(row.installment) || 0));

        return {
            administradora: row.admin,
            produto: formatProductLabel(row.product),
            status: row.statusLabel,
            grupo: numberFormatter.format(row.group),
            credito: formatCurrencyFromCents(row.credit),
            entrada: formatCurrencyFromCents(row.entry),
            prazo: numberFormatter.format(row.term),
            qtdParcelas: qtdParcelasNum ? numberFormatter.format(qtdParcelasNum) : "—",
            valorParcela: valorParcelaCents ? decimalFormatter.format(valorParcelaCents / 100) : "—",
            fases: row.installmentPhasesText || "—"
        };
    });
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function buildExportTableMarkup(rows) {
    const headings = [
        "Administradora", "Produto", "Status", "Grupo", "Valor do crédito",
        "Entrada", "Prazo", "Qtd. parcelas", "Valor da parcela", "Fases"
    ];
    const bodyRows = rows
        .map(
            (row) => `
        <tr>
            <td>${escapeHtml(row.administradora)}</td>
            <td>${escapeHtml(row.produto)}</td>
            <td>${escapeHtml(row.status)}</td>
            <td>${escapeHtml(row.grupo)}</td>
            <td>${escapeHtml(row.credito)}</td>
            <td>${escapeHtml(row.entrada)}</td>
            <td>${escapeHtml(row.prazo)}</td>
            <td>${escapeHtml(row.qtdParcelas)}</td>
            <td>${escapeHtml(row.valorParcela)}</td>
            <td>${escapeHtml(row.fases)}</td>
        </tr>
    `
        )
        .join("");

    return `
        <table>
            <thead>
                <tr>${headings.map((heading) => `<th>${escapeHtml(heading)}</th>`).join("")}</tr>
            </thead>
            <tbody>${bodyRows}</tbody>
        </table>
    `;
}

function getProposalTotals(rows) {
    const totalCredit = rows.reduce((sum, row) => sum + row.credit, 0);
    const totalEntry = rows.reduce((sum, row) => sum + row.entry, 0);
    const totalBalance = rows.reduce((sum, row) => sum + row.balance, 0);
    const totalTransferFee = rows.reduce((sum, row) => sum + (row.transferFee || 0), 0);
    return {
        totalCredit,
        totalEntry,
        totalBalance,
        totalTransferFee,
        totalFullValue: totalEntry + totalBalance
    };
}

function downloadBlob(content, mimeType, filename) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function exportToExcel() {
    const rows = getExportRows();
    const tableMarkup = buildExportTableMarkup(rows);
    const excelDocument = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <style>
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #d9d9d9; padding: 8px 10px; text-align: left; }
                th { background: #6B398E; color: #fff; }
            </style>
        </head>
        <body>${tableMarkup}</body>
        </html>
    `;
    downloadBlob(excelDocument, "application/vnd.ms-excel;charset=utf-8", "rc-cartas-contempladas.xls");
}

function exportToPdf() {
    const rows = getExportRows();
    const tableMarkup = buildExportTableMarkup(rows);
    const printWindow = window.open("", "_blank", "width=1120,height=780");
    if (!printWindow) {
        if (elements.results) elements.results.textContent = "Permita pop-ups para exportar em PDF.";
        return;
    }
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Cartas contempladas - TM Consórcios</title>
            <style>
                @page { margin: 18mm; }
                body { color: #241633; font-family: Arial, sans-serif; }
                h1 { margin: 0 0 16px; font-size: 22px; color: #6B398E; }
                table { border-collapse: collapse; width: 100%; font-size: 12px; }
                th, td { border: 1px solid #DDD8F9; padding: 8px; text-align: left; }
                th { background: #6B398E; color: #fff; }
            </style>
        </head>
        <body>
            <h1>Cartas contempladas - TM Consórcios</h1>
            ${tableMarkup}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
}

/* ------------------------------------------------------------------ *
 * WhatsApp / composição
 * ------------------------------------------------------------------ */

function buildWhatsAppFallbackText(rows) {
    if (rows.length === 1) {
        const row = rows[0];
        const lines = [
            "Olá, sou cliente e tenho interesse nesta carta contemplada.",
            "",
            "Carta " + row.numero,
            "Administradora: " + row.admin,
            "Produto: " + formatProductLabel(row.product),
            "Status: " + row.statusLabel,
            "Crédito: " + formatCurrencyFromCents(row.credit),
            "Entrada: " + formatCurrencyFromCents(row.entry),
            "Prazo: " + numberFormatter.format(row.term) + " meses",
            "Parcelas/fases: " + (row.installmentPhasesText || "—")
        ];
        return lines.join("\n");
    }

    const { totalCredit, totalEntry, totalBalance, totalTransferFee } = getProposalTotals(rows);
    const installmentLines = buildCombinedInstallmentRanges(rows).map(formatWhatsAppInstallmentRangeLine);
    const adminLabel = String(rows[0]?.admin || "administradora").trim().toLocaleUpperCase("pt-BR");
    const resumo = [
        "Olá, sou cliente e tenho interesse em uma composição de " + numberFormatter.format(rows.length) + " cotas contempladas da " + adminLabel,
        "",
        "RESUMO DA COMPOSIÇÃO",
        "",
        "Crédito: " + formatCurrencyFromCents(totalCredit),
        "Entrada: " + formatCurrencyFromCents(totalEntry),
        "Saldo devedor: " + formatCurrencyFromCents(totalBalance)
    ];
    if (totalTransferFee > 0) {
        resumo.push("Taxa de transferência: " + formatCurrencyFromCents(totalTransferFee));
    }
    resumo.push("", "Parcelas:", ...installmentLines);

    resumo.push("", "Detalhes por carta:");
    rows.forEach((row, i) => {
        resumo.push(
            (i + 1) + ". " + formatProductLabel(row.product) +
            " | Crédito " + formatCurrencyFromCents(row.credit) +
            " | Entrada " + formatCurrencyFromCents(row.entry) +
            " | Prazo " + numberFormatter.format(row.term) + " meses" +
            " | Parcelas/fases: " + (row.installmentPhasesText || "—")
        );
    });
    return resumo.join("\n");
}

function buildWhatsAppFallbackLink(rows) {
    return rcBuildWaMeUrl(buildWhatsAppFallbackText(rows));
}

function buildRowInstallmentTimeline(row) {
    const phases = Array.isArray(row.installmentPhases) ? row.installmentPhases : [];
    const timeline = [];
    phases.forEach((phase) => {
        const count = Math.max(0, Math.round(Number(phase.count) || 0));
        const amountCents = Math.max(0, Math.round(Number(phase.amountCents) || 0));
        if (!count || !amountCents) return;
        for (let i = 0; i < count; i++) timeline.push(amountCents);
    });
    if (!timeline.length && row.term > 0 && row.installment > 0) {
        for (let i = 0; i < row.term; i++) timeline.push(row.installment);
    }
    return timeline;
}

function buildCombinedInstallmentRanges(rows) {
    const timelines = rows.map(buildRowInstallmentTimeline);
    const maxLength = Math.max(0, ...timelines.map((timeline) => timeline.length));
    const ranges = [];
    for (let month = 0; month < maxLength; month++) {
        const amountCents = timelines.reduce((sum, timeline) => sum + (timeline[month] || 0), 0);
        if (!amountCents) continue;
        const previous = ranges[ranges.length - 1];
        if (previous && previous.amountCents === amountCents && previous.end === month) {
            previous.end = month + 1;
        } else {
            ranges.push({ start: month + 1, end: month + 1, amountCents });
        }
    }
    return ranges;
}

function formatInstallmentRangeLine(range) {
    const amount = formatCurrencyFromCents(range.amountCents);
    if (range.start === range.end) {
        return "Parcela " + numberFormatter.format(range.start) + " de " + amount;
    }
    return "Parcelas " + numberFormatter.format(range.start) + " a " + numberFormatter.format(range.end) + " de " + amount;
}

function formatWhatsAppInstallmentRangeLine(range) {
    const amount = formatCurrencyFromCents(range.amountCents);
    if (range.start === range.end) {
        return numberFormatter.format(range.start) + " de " + amount;
    }
    return numberFormatter.format(range.start) + " a " + numberFormatter.format(range.end) + " de " + amount;
}

function buildCombinedInstallmentLines(rows) {
    return buildCombinedInstallmentRanges(rows).map(formatInstallmentRangeLine);
}

function negociarHref(row) {
    if (isProposalBlocked(row)) return "#";
    return buildWhatsAppFallbackLink([row]);
}

/* ------------------------------------------------------------------ *
 * Modal de detalhes
 * ------------------------------------------------------------------ */

let detailModalOpen = false;
let detailModalLastFocus = null;

function getFocusableInDetailDialog() {
    const dialog = elements.detailModalDialog;
    if (!dialog) return [];
    return Array.from(
        dialog.querySelectorAll(
            "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"])"
        )
    ).filter((el) => {
        if (el.closest("[hidden]")) return false;
        return el.getAttribute("aria-hidden") !== "true";
    });
}

function onDetailModalKeydown(e) {
    if (!detailModalOpen) return;
    if (e.key === "Escape") { e.preventDefault(); closeDetailModal(); return; }
    if (e.key !== "Tab") return;
    const list = getFocusableInDetailDialog();
    if (!list.length) return;
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
    }
}

function setDetailText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function renderInstallmentPhases(row) {
    return `<span class="rc-phase-text">${escapeHtml(row.installmentPhasesText || "—")}</span>`;
}

function fillDetailModal(row) {
    const badge = document.getElementById("rc-detail-hero-badge");
    if (badge) badge.textContent = row.tipoLabel || "—";
    setDetailText("rc-detail-numero", row.numero || "—");
    setDetailText("rc-detail-valor", formatCurrencyFromCents(row.credit));
    setDetailText("rc-detail-subparcelas", row.subParcelasText || "—");
    setDetailText("rc-detail-admin", row.admin || "—");
    setDetailText("rc-detail-taxa", row.taxaPt || "—");
    setDetailText("rc-detail-entrada", formatCurrencyFromCents(row.entry));
    setDetailText("rc-detail-pct-entrada", row.entradaPercentPt || "—");
    setDetailText("rc-detail-saldo", formatCurrencyFromCents(row.balance));
    setDetailText("rc-detail-prazo", row.term > 0 ? numberFormatter.format(row.term) + " meses" : "—");

    const foot = elements.detailVendida;
    if (foot) {
        const showVendida =
            row.statusKey === "vendida" && Boolean((row.vendidoParaName && row.vendidoParaName.trim()) || row.vendidoEmPt !== "—");
        foot.hidden = !showVendida;
        if (showVendida) {
            setDetailText("rc-detail-vendido-nome", (row.vendidoParaName && row.vendidoParaName.trim()) || "—");
            setDetailText("rc-detail-vendido-data", row.vendidoEmPt || "—");
        }
    }

    const negotiationBlocked = isProposalBlocked(row);
    if (elements.detailNegotiation) elements.detailNegotiation.hidden = negotiationBlocked;
    if (!negotiationBlocked && elements.detailWhatsapp) {
        elements.detailWhatsapp.href = buildWhatsAppFallbackLink([row]);
    }
}

function openDetailModal(rowId) {
    const row = cartasData.find((r) => r.id === rowId);
    if (!row || !elements.detailModal) return;
    detailModalLastFocus = document.activeElement;
    fillDetailModal(row);
    elements.detailModal.removeAttribute("hidden");
    document.body.style.overflow = "hidden";
    detailModalOpen = true;
    document.addEventListener("keydown", onDetailModalKeydown, true);
    requestAnimationFrame(() => {
        if (elements.detailModalClose) elements.detailModalClose.focus();
    });
}

function closeDetailModal() {
    if (!detailModalOpen || !elements.detailModal) return;
    elements.detailModal.setAttribute("hidden", "");
    document.body.style.overflow = "";
    detailModalOpen = false;
    document.removeEventListener("keydown", onDetailModalKeydown, true);
    if (detailModalLastFocus && typeof detailModalLastFocus.focus === "function") {
        try { detailModalLastFocus.focus(); } catch { /* ignore */ }
    }
    detailModalLastFocus = null;
}

/* ------------------------------------------------------------------ *
 * Modal de proposta
 * ------------------------------------------------------------------ */

let propostaModalOpen = false;
let propostaModalLastFocus = null;

function getFocusableInPropostaDialog() {
    const dialog = elements.propostaModalDialog;
    if (!dialog) return [];
    return Array.from(
        dialog.querySelectorAll(
            "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"])"
        )
    ).filter((el) => {
        if (el.closest("[hidden]")) return false;
        return el.getAttribute("aria-hidden") !== "true";
    });
}

function onPropostaModalKeydown(e) {
    if (!propostaModalOpen) return;
    if (e.key === "Escape") { e.preventDefault(); closePropostaModal(); return; }
    if (e.key !== "Tab") return;
    const list = getFocusableInPropostaDialog();
    if (!list.length) return;
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
    }
}

function fillPropostaModal(rows) {
    const adminLabel = rows.length ? rows[0].admin : "—";
    const { totalCredit, totalEntry, totalBalance, totalFullValue } = getProposalTotals(rows);
    const maxTerm = Math.max(0, ...rows.map((row) => row.term || 0));
    const countLabel = rows.length === 1 ? "1 cota selecionada" : numberFormatter.format(rows.length) + " cotas selecionadas";

    setDetailText("rc-proposta-admin", adminLabel);
    setDetailText("rc-proposta-count", countLabel);
    setDetailText("rc-proposta-credito", formatCurrencyFromCents(totalCredit));
    setDetailText("rc-proposta-entrada-kv", formatCurrencyFromCents(totalEntry));
    setDetailText("rc-proposta-saldo-kv", formatCurrencyFromCents(totalBalance));
    setDetailText("rc-proposta-total-kv", formatCurrencyFromCents(totalFullValue));
    setDetailText("rc-proposta-prazo-kv", maxTerm > 0 ? numberFormatter.format(maxTerm) + " meses" : "—");

    const compBlock = document.getElementById("rc-proposta-composicao");
    const compList = document.getElementById("rc-proposta-composicao-list");
    const lines = buildCombinedInstallmentLines(rows);
    if (compList) compList.innerHTML = lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("");
    if (compBlock) compBlock.hidden = lines.length === 0;

    const cartasList = document.getElementById("rc-proposta-cartas");
    if (cartasList) {
        cartasList.innerHTML = rows
            .map((row) => {
                const info = [
                    formatProductLabel(row.product),
                    "Crédito " + formatCurrencyFromCents(row.credit),
                    "Entrada " + formatCurrencyFromCents(row.entry),
                    "Saldo devedor " + formatCurrencyFromCents(row.balance),
                    "Valor completo " + formatCurrencyFromCents(row.entry + row.balance),
                    "Prazo " + (row.term > 0 ? numberFormatter.format(row.term) + " meses" : "—"),
                    "Parcelas/fases: " + (row.installmentPhasesText || "—")
                ].join(" · ");
                return (
                    `<li><span class="rc-proposta-carta__num" translate="no">Carta ${escapeHtml(row.numero || "—")}</span>` +
                    `<span class="rc-proposta-carta__info">${escapeHtml(info)}</span></li>`
                );
            })
            .join("");
    }

    const negotiationTitle = document.getElementById("rc-proposta-negotiation-title");
    if (negotiationTitle) {
        negotiationTitle.textContent = "Atendimento pelo WhatsApp";
    }
    if (elements.propostaWhatsapp) {
        const actionLabel = rows.length === 1 ? "Negociar carta" : "Negociar composição";
        elements.propostaWhatsapp.href = buildWhatsAppFallbackLink(rows);
        elements.propostaWhatsapp.setAttribute("aria-label", actionLabel + " pelo WhatsApp");
        const label = elements.propostaWhatsapp.querySelector("span");
        if (label) label.textContent = actionLabel;
    }
}

function openPropostaModal() {
    const rows = cartasData.filter((row) => state.selectedIds.has(row.id));
    if (!rows.length || !elements.propostaModal) return;
    propostaModalLastFocus = document.activeElement;
    fillPropostaModal(rows);
    elements.propostaModal.removeAttribute("hidden");
    document.body.style.overflow = "hidden";
    propostaModalOpen = true;
    document.addEventListener("keydown", onPropostaModalKeydown, true);
    requestAnimationFrame(() => {
        if (elements.propostaModalClose) elements.propostaModalClose.focus();
    });
}

function closePropostaModal() {
    if (!propostaModalOpen || !elements.propostaModal) return;
    elements.propostaModal.setAttribute("hidden", "");
    document.body.style.overflow = "";
    propostaModalOpen = false;
    document.removeEventListener("keydown", onPropostaModalKeydown, true);
    if (propostaModalLastFocus && typeof propostaModalLastFocus.focus === "function") {
        try { propostaModalLastFocus.focus(); } catch { /* ignore */ }
    }
    propostaModalLastFocus = null;
}

/* ------------------------------------------------------------------ *
 * Sincronização de URL
 * ------------------------------------------------------------------ */

function syncUrl() {
    const params = new URLSearchParams();
    if (state.search) params.set("q", state.search);
    if (state.term !== "all") params.set("prazo", state.term);
    if (state.entryRange !== "all") params.set("entrada", state.entryRange);
    if (state.sort !== "credit-desc") params.set("ordem", state.sort);
    if (state.apiStatus !== "all") params.set("status", state.apiStatus);
    if (state.apiTipo !== "all") params.set("tipo", state.apiTipo);
    const nextUrl = window.location.pathname + (params.toString() ? "?" + params.toString() : "") + window.location.hash;
    window.history.replaceState({}, "", nextUrl);
}

function hydrateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    state.search = params.get("q") || "";
    state.term = params.get("prazo") || "all";
    state.entryRange = params.get("entrada") || "all";
    state.sort = params.get("ordem") || "none";
    state.apiStatus = params.get("status") || "all";
    state.apiTipo = params.get("tipo") || "all";

    if (elements.search) elements.search.value = state.search;
    if (elements.term) elements.term.value = state.term;
    if (elements.entry) elements.entry.value = state.entryRange;
    if (elements.sort) elements.sort.value = state.sort;

    // Filtro de produto (botões Todos / Imóvel / Veículo)
    const allowedTipo = ["all", "imovel", "veiculo", "servico"];
    if (!allowedTipo.includes(state.apiTipo)) state.apiTipo = "all";
    syncTypeButtons();
}

function syncTypeButtons() {
    if (!elements.typeButtons) return;
    elements.typeButtons.forEach((btn) => {
        const isActive = (btn.getAttribute("data-tipo") || "all") === state.apiTipo;
        btn.classList.toggle("is-active", isActive);
        btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
}

/* ------------------------------------------------------------------ *
 * Painel de seleção
 * ------------------------------------------------------------------ */

function updateSelectionPanel() {
    Array.from(state.selectedIds).forEach((id) => {
        const row = cartasData.find((item) => item.id === id);
        if (!row || isProposalBlocked(row)) state.selectedIds.delete(id);
    });

    const selectedRows = cartasData.filter((row) => state.selectedIds.has(row.id));

    if (!selectedRows.length) {
        elements.selectionPanel.hidden = true;
        return;
    }

    const { totalCredit, totalEntry, totalBalance, totalTransferFee } = getProposalTotals(selectedRows);
    const maxTerm = Math.max(...selectedRows.map((r) => r.term || 0));

    const admins = [...new Set(selectedRows.map((row) => row.admin))];
    const adminLabel = admins.length === 1 ? admins[0] : numberFormatter.format(admins.length) + " administradoras";
    const countLabel = selectedRows.length === 1 ? "1 carta selecionada" : numberFormatter.format(selectedRows.length) + " cartas selecionadas";

    if (elements.selectionCount) elements.selectionCount.textContent = countLabel;
    if (elements.selectionAdmin) elements.selectionAdmin.textContent = adminLabel;
    if (elements.selectionCredit) elements.selectionCredit.textContent = formatCurrencyFromCents(totalCredit);
    if (elements.selectionEntry) elements.selectionEntry.textContent = formatCurrencyFromCents(totalEntry);
    if (elements.selectionBalance) elements.selectionBalance.textContent = formatCurrencyFromCents(totalBalance);
    if (elements.selectionTerm) elements.selectionTerm.textContent = maxTerm > 0 ? numberFormatter.format(maxTerm) + " meses" : "—";
    if (elements.selectionFee) elements.selectionFee.textContent = formatCurrencyFromCents(totalTransferFee);
    if (elements.selectionFeeMetric) elements.selectionFeeMetric.hidden = totalTransferFee <= 0;

    const phaseLines =
        selectedRows.length === 1
            ? (selectedRows[0].installmentPhases || []).map((phase) => phase.label).filter(Boolean)
            : buildCombinedInstallmentLines(selectedRows);
    if (elements.selectionPhasesList) {
        elements.selectionPhasesList.innerHTML = phaseLines
            .map((line) => `<span class="rc-selection-phase-pill rc-number">${escapeHtml(line)}</span>`)
            .join("");
    }
    if (elements.selectionPhases) elements.selectionPhases.hidden = phaseLines.length === 0;

    if (elements.selectionNegotiate) {
        const actionLabel = selectedRows.length === 1 ? "Negociar carta" : "Negociar composição";
        elements.selectionNegotiate.href = buildWhatsAppFallbackLink(selectedRows);
        elements.selectionNegotiate.setAttribute("aria-label", actionLabel + " pelo WhatsApp");
        const label = elements.selectionNegotiate.querySelector("span");
        if (label) label.textContent = actionLabel;
    }

    elements.selectionPanel.hidden = false;
}

function updateResults(rows) {
    if (state.loading) {
        if (elements.results) elements.results.textContent = "Carregando cartas…";
        elements.emptyState.hidden = true;
        if (elements.retryCartas) elements.retryCartas.hidden = true;
        return;
    }
    if (state.loadError) {
        if (elements.results) elements.results.textContent = publicLoadErrorTitle + ".";
        elements.emptyState.hidden = false;
        if (elements.emptyTitle) elements.emptyTitle.textContent = publicLoadErrorTitle;
        if (elements.emptyDetail) elements.emptyDetail.textContent = publicLoadErrorDetail;
        if (elements.retryCartas) elements.retryCartas.hidden = false;
        return;
    }
    const total = cartasData.length;
    const shown = rows.length;
    if (elements.results) {
        elements.results.textContent = "Exibindo " + numberFormatter.format(shown) + " de " + numberFormatter.format(total) + " cartas.";
    }
    elements.emptyState.hidden = shown > 0;
    if (elements.retryCartas) elements.retryCartas.hidden = true;
    if (elements.emptyTitle) elements.emptyTitle.textContent = "Nenhuma carta encontrada";
    if (elements.emptyDetail) elements.emptyDetail.textContent = "Ajuste os filtros ou os critérios de status/tipo para exibir outras opções.";
}

/* ------------------------------------------------------------------ *
 * Render — tabela desktop e cards mobile
 * ------------------------------------------------------------------ */

function renderTable(rows) {
    elements.tableBody.innerHTML = rows
        .map((row) => {
            const blockedProposal = isProposalBlocked(row);
            const selected = !blockedProposal && state.selectedIds.has(row.id);
            const actionHref = negociarHref(row);
            const adminLogo = getAdminLogo(row.admin);
            const productLabel = formatProductLabel(row.product);
            const pillClass = statusPillClass(row.statusKey);
            const proposalAction = blockedProposal
                ? `<button type="button" class="rc-action-btn rc-action-btn--disabled" disabled aria-label="Carta ${escapeHtml(row.numero)} reservada; proposta indisponível">Reservada</button>`
                : `<a class="rc-action-btn" href="${escapeHtml(actionHref)}" target="_blank" rel="noopener noreferrer">Negociar</a>`;

            const productKey = row.product ? row.product.toLowerCase() : "outro";
            return `
            <tr class="rc-row--${productKey}${selected ? " is-selected" : ""}">
                <td class="rc-select-cell" data-label="Selecionar">
                    <input class="rc-checkbox" type="checkbox" data-row-id="${escapeHtml(row.id)}" aria-label="${blockedProposal ? "Carta " + escapeHtml(row.numero) + " reservada; indisponível para juntar cotas" : "Selecionar carta " + escapeHtml(row.numero) + " para juntar cotas"}" ${selected ? "checked" : ""} ${blockedProposal ? "disabled" : ""}>
                </td>
                <th scope="row" data-label="Administradora">
                    <div class="rc-group-cell">
                        ${adminLogo ? `<img class="rc-admin-logo" src="${adminLogo.src}" alt="${escapeHtml(adminLogo.alt)}" width="112" height="60">` : `<span translate="no">${escapeHtml(row.admin)}</span>`}
                    </div>
                </th>
                <td data-label="Produto"><span class="rc-product-pill rc-product-pill--${productKey}">${escapeHtml(productLabel)}</span></td>
                <td data-label="Status"><span class="rc-status-pill ${pillClass}">${escapeHtml(row.statusLabel)}</span></td>
                <td class="rc-money-cell rc-number" data-label="Valor do crédito">${formatCurrencyFromCents(row.credit)}</td>
                <td class="rc-money-cell rc-number" data-label="Entrada">${formatCurrencyFromCents(row.entry)}</td>
                <td class="rc-term-cell rc-number" data-label="Prazo">${numberFormatter.format(row.term)}</td>
                <td class="rc-installment-cell rc-number" data-label="Parcelas / Fases">${renderInstallmentPhases(row)}</td>
                <td class="rc-detail-cell" data-label="Detalhes">
                    <button type="button" class="rc-eye-btn" data-rc-open-detail="${escapeHtml(row.id)}" aria-label="Ver detalhes da carta ${escapeHtml(row.numero)}">
                        <svg class="rc-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.7"/></svg>
                    </button>
                </td>
                <td class="rc-row-action" data-label="Ação">
                    <div class="rc-row-actions">
                        ${proposalAction}
                    </div>
                </td>
            </tr>
        `;
        })
        .join("");
}

function renderCards(rows) {
    elements.cardsGrid.innerHTML = rows
        .map((row) => {
            const blockedProposal = isProposalBlocked(row);
            const selected = !blockedProposal && state.selectedIds.has(row.id);
            const actionHref = negociarHref(row);
            const adminLogo = getAdminLogo(row.admin);
            const productLabel = formatProductLabel(row.product);
            const pillClass = statusPillClass(row.statusKey);
            const productKey = row.product ? row.product.toLowerCase() : "outro";
            const proposalAction = blockedProposal
                ? `<button type="button" class="rc-action-btn rc-action-btn--disabled" disabled aria-label="Carta ${escapeHtml(row.numero)} reservada; proposta indisponível">Reservada</button>`
                : `<a class="rc-action-btn" href="${escapeHtml(actionHref)}" target="_blank" rel="noopener noreferrer">Negociar</a>`;

            return `
            <article class="rc-card rc-card--${productKey}">
                <div class="rc-card-top">
                    <div>
                        <h3 class="rc-card-title rc-number">Grupo ${numberFormatter.format(row.group)}</h3>
                        <span class="rc-card-subtitle" translate="no">${escapeHtml(row.numero)}</span>
                    </div>
                    <input class="rc-checkbox" type="checkbox" data-row-id="${escapeHtml(row.id)}" aria-label="${blockedProposal ? "Carta " + escapeHtml(row.numero) + " reservada; indisponível para juntar cotas" : "Selecionar carta " + escapeHtml(row.numero)}" ${selected ? "checked" : ""} ${blockedProposal ? "disabled" : ""}>
                </div>
                ${adminLogo ? `<img class="rc-card-admin-logo" src="${adminLogo.src}" alt="${escapeHtml(adminLogo.alt)}" width="120" height="64">` : `<p class="rc-card-subtitle" translate="no">${escapeHtml(row.admin)}</p>`}
                <div class="rc-card-pills">
                    <span class="rc-product-pill rc-product-pill--${productKey}">${escapeHtml(productLabel)}</span>
                    <span class="rc-status-pill ${pillClass}">${escapeHtml(row.statusLabel)}</span>
                </div>
                <dl class="rc-card-grid">
                    <div>
                        <dt>Crédito</dt>
                        <dd class="rc-number">${formatCurrencyFromCents(row.credit)}</dd>
                    </div>
                    <div>
                        <dt>Entrada</dt>
                        <dd class="rc-number">${formatCurrencyFromCents(row.entry)}</dd>
                    </div>
                    <div>
                        <dt>Prazo</dt>
                        <dd class="rc-number">${numberFormatter.format(row.term)} meses</dd>
                    </div>
                    <div>
                        <dt>Parcelas</dt>
                        <dd class="rc-number rc-card-phases">${renderInstallmentPhases(row)}</dd>
                    </div>
                </dl>
                <div class="rc-card-actions">
                    <button type="button" class="rc-eye-btn" data-rc-open-detail="${escapeHtml(row.id)}" aria-label="Ver detalhes da carta ${escapeHtml(row.numero)}">
                        <svg class="rc-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.7"/></svg>
                    </button>
                    ${proposalAction}
                </div>
            </article>
        `;
        })
        .join("");
}

function render() {
    const filteredRows = getVisibleRows();
    const exportDisabled = state.loading || Boolean(state.loadError) || filteredRows.length === 0;
    if (elements.exportExcel) elements.exportExcel.disabled = exportDisabled;
    if (elements.exportPdf) elements.exportPdf.disabled = exportDisabled;
    if (elements.tableShell) elements.tableShell.hidden = exportDisabled;
    updateResults(filteredRows);
    if (!state.loading && !state.loadError) {
        renderTable(filteredRows);
        renderCards(filteredRows);
    } else {
        elements.tableBody.innerHTML = "";
        elements.cardsGrid.innerHTML = "";
    }
    updateSelectionPanel();
    updateSortIndicators();
    syncUrl();
}

/* ------------------------------------------------------------------ *
 * Eventos
 * ------------------------------------------------------------------ */

function updateStateFromForm() {
    if (elements.search) state.search = elements.search.value.trim();
    if (elements.term) state.term = elements.term.value;
    if (elements.entry) state.entryRange = elements.entry.value;
    if (elements.sort) state.sort = elements.sort.value;
    render();
}

function setTipoFilter(tipo) {
    const allowed = ["all", "imovel", "veiculo", "servico"];
    const next = allowed.includes(tipo) ? tipo : "all";
    if (next === state.apiTipo) return;
    state.apiTipo = next;
    syncTypeButtons();
    fetchCartas();
}

if (elements.detailModal) {
    elements.detailModal.addEventListener("click", (event) => {
        if (event.target.closest("[data-rc-modal-close]")) {
            event.preventDefault();
            closeDetailModal();
        }
    });
}

if (elements.propostaModal) {
    elements.propostaModal.addEventListener("click", (event) => {
        if (event.target.closest("[data-rc-modal-close]")) {
            event.preventDefault();
            closePropostaModal();
        }
    });
}

if (elements.selectionPreview) {
    elements.selectionPreview.addEventListener("click", (event) => {
        if (!state.selectedIds.size) return;
        event.preventDefault();
        openPropostaModal();
    });
}

if (elements.selectionClear) {
    elements.selectionClear.addEventListener("click", () => {
        state.selectedIds.clear();
        render();
        elements.tableBody?.querySelector(".rc-checkbox:not(:disabled)")?.focus();
    });
}

document.addEventListener("click", (event) => {
    const openBtn = event.target.closest("[data-rc-open-detail]");
    if (openBtn) {
        event.preventDefault();
        const rid = openBtn.getAttribute("data-rc-open-detail");
        if (rid) openDetailModal(rid);
        return;
    }

    const sortTh = event.target.closest(".rc-desktop-table thead th[data-rc-col]");
    if (sortTh) {
        const col = sortTh.getAttribute("data-rc-col");
        const current = state.sort;
        if (current === col + "-desc") state.sort = col + "-asc";
        else if (current === col + "-asc") state.sort = "none";
        else state.sort = col + "-desc";
        if (elements.sort) {
            const option = elements.sort.querySelector(`option[value="${state.sort}"]`);
            if (option) elements.sort.value = state.sort;
        }
        render();
    }
});

hydrateFromUrl();
fetchCartas();

if (elements.search) elements.search.addEventListener("input", updateStateFromForm);
if (elements.term) elements.term.addEventListener("change", updateStateFromForm);
if (elements.entry) elements.entry.addEventListener("change", updateStateFromForm);
if (elements.sort) elements.sort.addEventListener("change", updateStateFromForm);
if (elements.typeButtons) {
    elements.typeButtons.forEach((btn) => {
        btn.addEventListener("click", () => setTipoFilter(btn.getAttribute("data-tipo") || "all"));
    });
}
if (elements.exportExcel) elements.exportExcel.addEventListener("click", exportToExcel);
if (elements.exportPdf) elements.exportPdf.addEventListener("click", exportToPdf);
if (elements.retryCartas) elements.retryCartas.addEventListener("click", fetchCartas);

document.querySelectorAll(".rc-status-chip__input").forEach((input) => {
    input.addEventListener("change", () => {
        const key = input.getAttribute("data-status");
        if (key) state.statusVisible[key] = input.checked;
        render();
    });
});

if (elements.reset) {
    elements.reset.addEventListener("click", () => {
        state.search = "";
        state.term = "all";
        state.entryRange = "all";
        state.sort = "none";
        state.apiStatus = "all";
        state.apiTipo = "all";
        fetchCartas();
    });
}

/* ------------------------------------------------------------------ *
 * Toasts de bloqueio (administradoras diferentes / reservada)
 * ------------------------------------------------------------------ */

function showBlockingToast(title, message) {
    const existing = document.getElementById("rc-admin-toast");
    if (existing) existing.remove();
    const toast = document.createElement("div");
    toast.id = "rc-admin-toast";
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-live", "assertive");
    toast.innerHTML = "<strong>" + title + "</strong>" + "<span>" + message + "</span>";
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("is-visible"));
    setTimeout(() => {
        toast.classList.remove("is-visible");
        setTimeout(() => toast.remove(), 350);
    }, 4000);
}

function showAdminBlockToast(blockedAdmin, activeAdmin) {
    showBlockingToast(
        "Administradoras diferentes",
        "Você já selecionou cotas da <em>" + escapeHtml(activeAdmin) + "</em>. " +
            "Remova a seleção atual para adicionar cotas de <em>" + escapeHtml(blockedAdmin) + "</em>."
    );
}

function showReservedBlockToast(row) {
    showBlockingToast(
        "Carta reservada",
        "A carta <em>" + escapeHtml(row.numero || "selecionada") + "</em> está reservada e não pode entrar em uma proposta."
    );
}

document.addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-row-id]");
    if (!checkbox) return;

    const rowId = checkbox.getAttribute("data-row-id");
    const row = cartasData.find((r) => r.id === rowId);

    if (checkbox.checked) {
        const selectedRows = cartasData.filter((r) => state.selectedIds.has(r.id));

        if (isProposalBlocked(row)) {
            checkbox.checked = false;
            showReservedBlockToast(row);
            return;
        }

        if (row && selectedRows.length > 0) {
            const activeAdmin = selectedRows[0].admin.toLowerCase();
            const newAdmin = row.admin.toLowerCase();
            if (activeAdmin !== newAdmin) {
                checkbox.checked = false;
                showAdminBlockToast(row.admin, selectedRows[0].admin);
                return;
            }
        }

        state.selectedIds.add(rowId);
    } else {
        state.selectedIds.delete(rowId);
    }

    render();
});
