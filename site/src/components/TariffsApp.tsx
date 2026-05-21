import { useEffect, useMemo, useRef, useState } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Descuento {
  meses: number | null;
  soloNuevosClientes?: boolean;
  tipo: "porcentaje" | "fijo";
  valor: number;
}

interface TarifaDetalles {
  compensacionExcedentes?: number | null;
  descuento?: Descuento | null;
  energiaLlana: number;
  energiaPunta: number;
  energiaValle: number;
  incluyeBonoSocial?: boolean;
  mantenimientoPrecio?: number;
  nota?: string | null;
  notaImportante?: string | null;
  nombreTarifa: string;
  paraEmpresas?: string;
  permanencia?: string;
  periodos: number;
  potenciaMaxima?: number;
  potenciaPunta: number;
  potenciaValle: number;
  tipoCompensacionExcedentes?: string;
  ultimoCambio?: string;
}

interface Tarifa {
  comercializadora: string;
  detalles: TarifaDetalles;
}

interface DatosGenerales {
  actualizadoEn: string;
  alquilerContador: number;
  bonoSocial: number;
  impuestoElectrico: number;
  iva: number;
}

interface TarifasData {
  datosGenerales: DatosGenerales;
  tarifas: Tarifa[];
}

// ─── Utilidades ───────────────────────────────────────────────────────────────

const fmt = (n: number, dec = 5) =>
  n.toLocaleString("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec });

const fmtPct = (n: number) =>
  (n * 100).toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";

const fmtDate = (s: string) => {
  if (!s) return "—";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
};

const avgEnergy = (d: TarifaDetalles) =>
  d.periodos === 1
    ? d.energiaPunta
    : (d.energiaPunta + d.energiaLlana + d.energiaValle) / 3;

// ─── Componente BadgePeriodos ──────────────────────────────────────────────────

function BadgePeriodos({ periodos }: { periodos: number }) {
  const label = periodos === 1 ? "1 período" : `${periodos} períodos`;
  const cls =
    periodos === 1
      ? "bg-blue-500/10 text-blue-300 border-blue-500/20"
      : "bg-purple-500/10 text-purple-300 border-purple-500/20";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium num ${cls}`}
    >
      {label}
    </span>
  );
}

// ─── Componente PrecioEnergia ─────────────────────────────────────────────────

function PrecioEnergia({
  detalles,
  periodos,
}: {
  detalles: TarifaDetalles;
  periodos: number;
}) {
  if (periodos === 1) {
    return (
      <div className="flex items-baseline gap-1">
        <span className="num text-2xl font-bold text-[--color-volt]">
          {fmt(detalles.energiaPunta, 3)}
        </span>
        <span className="text-xs text-[--color-muted]">€/kWh</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-2">
        <span className="w-12 text-right text-[10px] font-medium uppercase tracking-wider text-[--color-muted]">
          Punta
        </span>
        <span className="num font-bold text-red-400">
          {fmt(detalles.energiaPunta, 3)} €
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-12 text-right text-[10px] font-medium uppercase tracking-wider text-[--color-muted]">
          Llana
        </span>
        <span className="num font-bold text-amber-300">
          {fmt(detalles.energiaLlana, 3)} €
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-12 text-right text-[10px] font-medium uppercase tracking-wider text-[--color-muted]">
          Valle
        </span>
        <span className="num font-bold text-[--color-green]">
          {fmt(detalles.energiaValle, 3)} €
        </span>
      </div>
    </div>
  );
}

// ─── TarjetaTarifa ────────────────────────────────────────────────────────────

function TarjetaTarifa({
  tarifa,
  rank,
  isBest,
  animDelay,
}: {
  tarifa: Tarifa;
  rank: number;
  isBest: boolean;
  animDelay: number;
}) {
  const d = tarifa.detalles;
  const [expanded, setExpanded] = useState(false);

  const hasDiscount = Boolean(d.descuento);
  const hasCompensacion = d.tipoCompensacionExcedentes && d.tipoCompensacionExcedentes !== "nocomp";

  return (
    <div
      className="card-animate group relative flex flex-col overflow-hidden rounded-xl border transition-all duration-200"
      style={{
        animationDelay: `${animDelay}ms`,
        borderColor: isBest
          ? "rgba(244,232,64,0.45)"
          : "rgba(255,255,255,0.07)",
        background: isBest ? "rgba(244,232,64,0.04)" : "var(--color-surface)",
      }}
    >
      {/* Borde izquierdo decorativo */}
      <div
        className="absolute top-0 left-0 h-full w-[3px] transition-all duration-300 group-hover:w-[4px]"
        style={{ background: isBest ? "var(--color-volt)" : "rgba(255,255,255,0.08)" }}
      />

      {/* Cabecera */}
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
        <div className="flex-1 min-w-0">
          {/* Rank + comercializadora */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className="num shrink-0 flex h-5 w-7 items-center justify-center rounded text-[10px] font-bold"
              style={{
                background: isBest ? "var(--color-volt)" : "var(--color-surface-alt)",
                color: isBest ? "#080c12" : "var(--color-muted)",
              }}
            >
              #{rank}
            </span>
            <span className="truncate font-bold text-sm tracking-wide uppercase"
              style={{ color: "var(--color-subtle)" }}>
              {tarifa.comercializadora}
            </span>
          </div>

          {/* Nombre tarifa */}
          <h3 className="font-bold text-base leading-snug" style={{ color: "var(--color-text)" }}>
            {d.nombreTarifa.replace(/\r\n/g, " ")}
          </h3>

          {/* Badges */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <BadgePeriodos periodos={d.periodos} />
            {d.permanencia && d.permanencia !== "NO" && (
              <span className="inline-flex items-center rounded-full border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 text-xs text-orange-300">
                Permanencia
              </span>
            )}
            {hasDiscount && (
              <span className="inline-flex items-center rounded-full border border-[--color-volt]/30 bg-[--color-volt]/10 px-2 py-0.5 text-xs font-medium text-[--color-volt]">
                {d.descuento!.tipo === "porcentaje"
                  ? `−${d.descuento!.valor}%`
                  : `−${d.descuento!.valor}€`}
                {d.descuento!.meses ? ` · ${d.descuento!.meses}m` : ""}
              </span>
            )}
            {hasCompensacion && (
              <span className="inline-flex items-center rounded-full border border-[--color-green]/20 bg-[--color-green]/10 px-2 py-0.5 text-xs text-[--color-green]">
                Excedentes
              </span>
            )}
            {d.incluyeBonoSocial && (
              <span className="inline-flex items-center rounded-full border border-teal-500/20 bg-teal-500/10 px-2 py-0.5 text-xs text-teal-300">
                Bono social
              </span>
            )}
          </div>
        </div>

        {/* Mejor precio badge */}
        {isBest && (
          <span className="shrink-0 rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-widest"
            style={{ background: "var(--color-volt)", color: "#080c12" }}>
            ★ Mejor
          </span>
        )}
      </div>

      {/* Precio energía */}
      <div className="border-t px-5 py-4" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[--color-muted]">
          Precio Energía · €/kWh
        </p>
        <PrecioEnergia detalles={d} periodos={d.periodos} />
      </div>

      {/* Potencia */}
      <div className="border-t px-5 py-3" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[--color-muted]">
          Potencia · €/kW/año
        </p>
        <div className="flex gap-4">
          <div>
            <span className="text-[10px] text-[--color-muted]">Punta</span>
            <p className="num font-bold text-sm" style={{ color: "var(--color-text)" }}>
              {fmt(d.potenciaPunta * 365, 2)}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-[--color-muted]">Valle</span>
            <p className="num font-bold text-sm" style={{ color: "var(--color-text)" }}>
              {fmt(d.potenciaValle * 365, 2)}
            </p>
          </div>
          {d.mantenimientoPrecio !== undefined && (
            <div>
              <span className="text-[10px] text-[--color-muted]">Mantenimiento</span>
              <p className="num font-bold text-sm" style={{ color: "var(--color-text)" }}>
                {d.mantenimientoPrecio}€/mes
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Toggle más info */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="border-t px-5 py-2.5 text-left text-xs transition-colors"
        style={{
          borderColor: "rgba(255,255,255,0.05)",
          color: "var(--color-muted)",
        }}
        type="button"
      >
        <span className="flex items-center gap-1">
          {expanded ? "▲ Menos" : "▼ Más info"}
          {d.ultimoCambio && (
            <span className="ml-auto text-[10px]">
              Actualizado {fmtDate(d.ultimoCambio)}
            </span>
          )}
        </span>
      </button>

      {expanded && (
        <div
          className="border-t px-5 py-4 space-y-2"
          style={{ borderColor: "rgba(255,255,255,0.05)" }}
        >
          {d.potenciaMaxima && (
            <p className="text-xs">
              <span className="text-[--color-muted]">Potencia máxima:</span>{" "}
              <span className="num font-medium">{d.potenciaMaxima} kW</span>
            </p>
          )}
          {hasCompensacion && d.compensacionExcedentes && (
            <p className="text-xs">
              <span className="text-[--color-muted]">Compensación excedentes:</span>{" "}
              <span className="num font-medium text-[--color-green]">
                {fmt(d.compensacionExcedentes, 3)} €/kWh
              </span>
            </p>
          )}
          {d.notaImportante && (
            <p className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-300">
              ⚠ {d.notaImportante}
            </p>
          )}
          {d.nota && !d.notaImportante && (
            <p className="text-xs text-[--color-subtle]">{d.nota}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Componente InfoBox ────────────────────────────────────────────────────────

function InfoBox({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border px-4 py-3"
      style={{ borderColor: "rgba(255,255,255,0.07)", background: "var(--color-surface)" }}>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[--color-muted]">
        {label}
      </p>
      <p className="num mt-1 text-lg font-bold" style={{ color: "var(--color-volt)" }}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-[10px] text-[--color-muted]">{sub}</p>}
    </div>
  );
}

// ─── App principal ────────────────────────────────────────────────────────────

type SortKey = "avg" | "punta" | "valle" | "potencia";
type FilterPeriodos = 0 | 1 | 3;

export default function TariffsApp({ base }: { base: string }) {
  const [data, setData] = useState<TarifasData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("avg");
  const [filterPeriodos, setFilterPeriodos] = useState<FilterPeriodos>(0);
  const [filterCompany, setFilterCompany] = useState<string>("todas");
  const [search, setSearch] = useState("");
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const url = `${base}/tarifas.json`;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error("Error al cargar");
        return r.json() as Promise<TarifasData>;
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError("No se pudieron cargar las tarifas. Inténtalo más tarde.");
        setLoading(false);
      });
  }, [base]);

  const companies = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.tarifas.map((t) => t.comercializadora))].sort();
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.tarifas
      .filter((t) => {
        if (filterPeriodos !== 0 && t.detalles.periodos !== filterPeriodos) return false;
        if (filterCompany !== "todas" && t.comercializadora !== filterCompany) return false;
        if (search) {
          const q = search.toLowerCase();
          return (
            t.comercializadora.toLowerCase().includes(q) ||
            t.detalles.nombreTarifa.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        const da = a.detalles;
        const db = b.detalles;
        switch (sortKey) {
          case "avg":
            return avgEnergy(da) - avgEnergy(db);
          case "punta":
            return da.energiaPunta - db.energiaPunta;
          case "valle":
            return da.energiaValle - db.energiaValle;
          case "potencia":
            return da.potenciaPunta - db.potenciaPunta;
          default:
            return 0;
        }
      });
  }, [data, filterPeriodos, filterCompany, search, sortKey]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-12 w-12 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--color-volt)", borderTopColor: "transparent" }}
          />
          <p className="text-[--color-muted] text-sm">Cargando tarifas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="max-w-sm text-center rounded-xl border border-red-500/20 bg-red-500/10 p-8">
          <p className="text-4xl mb-3">⚡</p>
          <p className="font-bold text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { datosGenerales: dg } = data;

  return (
    <div className="min-h-screen">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden border-b"
        style={{ borderColor: "rgba(244,232,64,0.1)" }}>
        {/* Decoración de fondo */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full opacity-10 blur-3xl"
            style={{ background: "var(--color-volt)" }} />
          <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full opacity-5 blur-3xl"
            style={{ background: "#60a5fa" }} />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              {/* Logo/titulo */}
              <div className="flex items-center gap-3 mb-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl text-2xl"
                  style={{ background: "var(--color-volt)", color: "#080c12" }}>
                  ⚡
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-[--color-muted]">
                  Tarifas Luz España
                </span>
              </div>
              <h1 className="font-black text-4xl leading-none tracking-tight sm:text-5xl lg:text-6xl"
                style={{ color: "var(--color-text)" }}>
                Comparador de<br />
                <span style={{ color: "var(--color-volt)" }}>tarifas eléctricas</span>
              </h1>
              <p className="mt-3 max-w-md text-sm text-[--color-subtle]">
                Datos del mercado libre actualizados diariamente. Encuentra la tarifa
                más barata para tu hogar.
              </p>
            </div>

            {/* Datos fiscales */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-4">
              <InfoBox label="IVA" value={fmtPct(dg.iva)} sub="sobre factura" />
              <InfoBox
                label="Imp. Eléctrico"
                value={fmtPct(dg.impuestoElectrico)}
                sub="sobre energía"
              />
              <InfoBox
                label="Alquiler Contador"
                value={`${fmt(dg.alquilerContador, 3)}€/día`}
                sub="Movistar/Endesa"
              />
              <InfoBox
                label="Actualizado"
                value={fmtDate(dg.actualizadoEn)}
                sub={`${data.tarifas.length} tarifas`}
              />
            </div>
          </div>
        </div>
      </header>

      {/* ── Filtros ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 border-b backdrop-blur-md"
        style={{
          borderColor: "rgba(255,255,255,0.05)",
          background: "rgba(8,12,18,0.85)",
        }}>
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-3">
            {/* Búsqueda */}
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[--color-muted] text-sm">
                🔍
              </span>
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border py-2 pl-8 pr-3 text-sm outline-none focus:ring-1 transition-all"
                style={{
                  background: "var(--color-surface)",
                  borderColor: "rgba(255,255,255,0.08)",
                  color: "var(--color-text)",
                  ["--tw-ring-color" as string]: "var(--color-volt)",
                }}
              />
            </div>

            {/* Períodos */}
            <div className="flex rounded-lg border p-0.5 gap-0.5"
              style={{ borderColor: "rgba(255,255,255,0.07)", background: "var(--color-surface)" }}>
              {([0, 1, 3] as FilterPeriodos[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setFilterPeriodos(p)}
                  className="rounded-md px-3 py-1.5 text-xs font-medium transition-all"
                  type="button"
                  style={
                    filterPeriodos === p
                      ? { background: "var(--color-volt)", color: "#080c12" }
                      : { color: "var(--color-muted)" }
                  }
                >
                  {p === 0 ? "Todos" : `${p}P`}
                </button>
              ))}
            </div>

            {/* Comercializadora */}
            <select
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1 transition-all"
              style={{
                background: "var(--color-surface)",
                borderColor: "rgba(255,255,255,0.08)",
                color: "var(--color-text)",
              }}
            >
              <option value="todas">Todas las empresas</option>
              {companies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Ordenar */}
            <div className="flex items-center gap-2 ml-auto text-xs text-[--color-muted]">
              <span className="hidden sm:inline">Ordenar por:</span>
              {(
                [
                  { key: "avg", label: "Media energía" },
                  { key: "punta", label: "Punta" },
                  { key: "valle", label: "Valle" },
                  { key: "potencia", label: "Potencia" },
                ] as { key: SortKey; label: string }[]
              ).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSortKey(key)}
                  className="rounded-md px-2.5 py-1.5 transition-all"
                  type="button"
                  style={
                    sortKey === key
                      ? { background: "var(--color-volt-dim)", color: "var(--color-volt)", border: "1px solid var(--color-border-strong)" }
                      : { color: "var(--color-muted)", border: "1px solid transparent" }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Grid de tarifas ──────────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Resultado count */}
        <p className="mb-5 text-xs text-[--color-muted]">
          Mostrando <span className="num font-bold text-[--color-text]">{filtered.length}</span>
          {" "}de{" "}
          <span className="num font-bold text-[--color-text]">{data.tarifas.length}</span> tarifas
          {" · "}ordenadas por{" "}
          <span style={{ color: "var(--color-volt)" }}>
            {sortKey === "avg" && "precio medio de energía"}
            {sortKey === "punta" && "energía punta"}
            {sortKey === "valle" && "energía valle"}
            {sortKey === "potencia" && "precio de potencia"}
          </span>
        </p>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center"
            style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-bold text-[--color-text]">Sin resultados</p>
            <p className="mt-1 text-sm text-[--color-muted]">
              Prueba con otros filtros o términos de búsqueda.
            </p>
            <button
              onClick={() => {
                setFilterPeriodos(0);
                setFilterCompany("todas");
                setSearch("");
              }}
              className="mt-4 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              style={{ background: "var(--color-volt)", color: "#080c12" }}
              type="button"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div
            ref={gridRef}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((tarifa, i) => (
              <TarjetaTarifa
                key={`${tarifa.comercializadora}-${tarifa.detalles.nombreTarifa}`}
                tarifa={tarifa}
                rank={i + 1}
                isBest={i === 0}
                animDelay={i * 40}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 border-t pt-8 pb-4 text-center text-xs text-[--color-muted]"
          style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <p>
            Datos obtenidos del mercado libre español · Los precios no incluyen IVA ni impuestos salvo
            indicación · Actualizado{" "}
            <span className="num text-[--color-subtle]">{fmtDate(dg.actualizadoEn)}</span>
          </p>
          <p className="mt-1">
            <a
              href="https://github.com/soker90/tarifas-luz"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-[--color-volt]"
            >
              Código en GitHub
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
