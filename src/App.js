import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";

function App() {
  const [ventas, setVentas] = useState(() => {
  const data = localStorage.getItem("ventas");
  return data ? JSON.parse(data) : [];
});
const [modoOscuro, setModoOscuro] = useState(() => {
  const guardado = localStorage.getItem("modo");
  return guardado !== null ? JSON.parse(guardado) : true;
});

useEffect(() => {
  localStorage.setItem("ventas", JSON.stringify(ventas));
}, [ventas]);

// 🔹 STATES PRIMERO
const [historial, setHistorial] = useState(() => {
  const data = localStorage.getItem("historial");
  return data ? JSON.parse(data) : [];
});

const [verHistorial, setVerHistorial] = useState(false);

const [mostrarCaja, setMostrarCaja] = useState(false);

const [caja, setCaja] = useState(() => {
  const data = localStorage.getItem("caja");
  return data ? JSON.parse(data) : { efectivo: 0, transferencia: 0 };
});

const [animandoId, setAnimandoId] = useState(null);

// 🔹 DESPUÉS LOS useEffect
useEffect(() => {
  localStorage.setItem("modo", JSON.stringify(modoOscuro));
}, [modoOscuro]);

useEffect(() => {
  localStorage.setItem("historial", JSON.stringify(historial));
}, [historial]);

useEffect(() => {
  localStorage.setItem("caja", JSON.stringify(caja));
}, [caja]);
  const [carrito, setCarrito] = useState([]);

  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [precioSeleccionado, setPrecioSeleccionado] = useState("");

  const [cliente, setCliente] = useState("");
  const [tipoPedido, setTipoPedido] = useState("Local");
  const [direccion, setDireccion] = useState("");

  const productos = [
    { nombre: "Salchipapas", precios: [8000, 11000, 13000, 16000] },
    { nombre: "Perros Calientes", precios: [4000, 6000, 7000, 8000] },
    { nombre: "Hamburguesas", precios: [10000, 13000, 16000, 18000] },
    { nombre: "Patacón Relleno", precios: [9000, 11000] },
    { nombre: "Desgranados", precios: [15000, 19000, 23000] },
    { nombre: "Picadas", precios: [15000, 19000, 26000] },
    { nombre: "Miti Miti", precios: [30000] },
    { nombre: "Gaseosa", precios: [2000, 5000] }
  ];

  const handleProducto = (e) => {
    const prod = productos.find(p => p.nombre === e.target.value);
    setProductoSeleccionado(prod);
    setPrecioSeleccionado("");
  };

  const agregar = () => {
    if (!productoSeleccionado || !precioSeleccionado) return;

    const item = {
      id: crypto.randomUUID(),
      nombre: productoSeleccionado.nombre,
      cantidad,
      precio: Number(precioSeleccionado),
      total: cantidad * Number(precioSeleccionado)
    };

    setCarrito([...carrito, item]);
  };

  const eliminar = (id) => {
    setCarrito(carrito.filter(i => i.id !== id));
  };

  const totalProductos = carrito.reduce((a, b) => a + b.total, 0);

  const costoDomicilio = () => {
    if (tipoPedido !== "Domicilio") return 0;
    const d = direccion.toLowerCase();
    if (d.includes("moquen") || d.includes("varsovia")) return 3000;
    return 0;
  };

  const totalFinal = totalProductos + costoDomicilio();
const totalDia = historial.reduce((acc, v) => acc + v.total, 0);

  const crearPedido = () => {
    if (!carrito || carrito.length === 0 || totalFinal <= 0) return;

console.log("TIPO PEDIDO:", tipoPedido);
console.log("DIRECCION:", direccion);

    const pedido = {
  id: crypto.randomUUID(),
  cliente: cliente || "Sin nombre",
  fecha: new Date().toLocaleString(),
  tipoPedido: tipoPedido || "Local",
  direccion: direccion || "",
  items: [...carrito],
  total: totalFinal || 0,
  estado: "Pendiente",
  metodoPago: ""
};

    setVentas([...ventas, pedido]);
    setCarrito([]);
    setCliente("");
    setDireccion("");
  };

  const pagar = (id, metodo) => {
    const pedido = ventas.find(v => v.id === id);

    if (!pedido || pedido.estado === "Pagado") return;

    setVentas(prev =>
      prev.map(v =>
        v.id === id ? { ...v, estado: "Pagado", metodoPago: metodo } : v
      )
    );

    setCaja(prev => ({
      efectivo:
        metodo === "Efectivo"
          ? prev.efectivo + pedido.total
          : prev.efectivo,

      transferencia:
        metodo === "Transferencia"
          ? prev.transferencia + pedido.total
          : prev.transferencia
    }));
  };

  const guardarEnHistorial = (id) => {
  const pedido = ventas.find(v => v.id === id);
  if (!pedido) return;

  setHistorial(prev => {
    const nuevoHistorial = [pedido, ...prev];

    // 🔥 guardar inmediatamente
    localStorage.setItem("historial", JSON.stringify(nuevoHistorial));

    return nuevoHistorial;
  });

  setVentas(prev => prev.filter(v => v.id !== id));
};

  const eliminarPedido = (id) => {
    setVentas(ventas.filter(v => v.id !== id));
  };

  const descargarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(9);

   let y = 15;
let totalDia = 0;
const pageHeight = 280;

    const line = (t) => {
  if (y > pageHeight) {
    doc.addPage();
    y = 15;
  }
  doc.text(String(t), 10, y);
  y += 6;
};

    const sep = () => {
      doc.line(10, y, 200, y);
      y += 6;
    };

    line("ESKINA CALIENTE");
    sep();

    historial.forEach(p => {
      line(`Cliente: ${p.cliente}`);
      line(`Hora: ${p.fecha}`);
      line(`Tipo: ${p.tipoPedido}`);

      if (p.tipoPedido === "Domicilio") {
        line(`Direccion: ${p.direccion}`);
      }

      line(`Estado: ${p.estado}`);

      if (p.estado === "Pagado") {
        line(`Metodo: ${p.metodoPago}`);
      }

      sep();

      (p.items || []).forEach(i => {
        line(`${i.nombre} x${i.cantidad} = $${i.total}`);
      });

      line(`TOTAL: $${p.total}`);

      totalDia += p.total;

      sep();
      y += 4;
    });

sep();

doc.setFont("helvetica", "bold");
line(`TOTAL DEL DIA: $${totalDia.toLocaleString("es-CO")}`);

sep();

doc.setFont("helvetica", "bold");
line("PAGOS:");

doc.setFont("helvetica", "normal");
line(`Efectivo: $${(caja.efectivo || 0).toLocaleString("es-CO")}`);
line(`Transferencia: $${(caja.transferencia || 0).toLocaleString("es-CO")}`);

const fecha = new Date().toISOString().slice(0,10);
doc.save(`ventas-${fecha}.pdf`);
 
 };

  return (
    <div style={{
  ...styles.app,
  background: modoOscuro ? "#0f172a" : "#f1f5f9",
  color: modoOscuro ? "white" : "black"
}}>

      <h2 style={styles.title}>ESKINA CALIENTE</h2>

<h3 style={{ textAlign: "center" }}>
  💰 Hoy: {totalDia.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}
</h3>

<button
  onClick={() => setModoOscuro(!modoOscuro)}
  style={{
    position: "fixed",
    top: 15,
    left: 15,
    width: 50,
    height: 50,
    borderRadius: "50%",
    background: "#334155",
    border: "none",
    fontSize: 20
  }}
>
  {modoOscuro ? "☀️" : "🌙"}
</button>

      <button onClick={() => setMostrarCaja(!mostrarCaja)} style={styles.btnCaja}>
        💳
      </button>

      {mostrarCaja && (
        <div style={styles.cajaBox}>
          <div>💵 Efectivo: ${caja.efectivo}</div>
          <div>🏦 Transferencia: ${caja.transferencia}</div>
        </div>
      )}

      <div style={styles.grid}>

        <select onChange={handleProducto} style={styles.input}>
          <option>Producto</option>
          {productos.map((p, i) => (
            <option key={i}>{p.nombre}</option>
          ))}
        </select>

        <select value={cantidad} onChange={e => setCantidad(Number(e.target.value))} style={styles.input}>
          {[1,2,3,4,5].map(n => <option key={n}>{n}</option>)}
        </select>

        <select
          value={precioSeleccionado}
          onChange={e => setPrecioSeleccionado(Number(e.target.value))}
          style={styles.input}
        >
          <option value="">Precio</option>
          {productoSeleccionado?.precios.map((p, i) => (
            <option key={i} value={p}>${p}</option>
          ))}
        </select>

        <input
          placeholder="Cliente"
          value={cliente}
          onChange={e => setCliente(e.target.value)}
          style={styles.input}
        />

      </div>

      <button
  onClick={agregar}
  style={styles.btnAdd}
  onTouchStart={(e) => e.target.style.transform = "scale(0.96)"}
  onTouchEnd={(e) => e.target.style.transform = "scale(1)"}
>
  ➕ Agregar Producto
</button>

      <h4>Pedido actual</h4>

      {carrito.map(i => (
  <div
    key={i.id}
    style={{
      ...styles.card,
      transform: animandoId === i.id ? "scale(1.05)" : "scale(1)",
      opacity: animandoId === i.id ? 0.5 : 1,
      transition: "all 0.3s ease"
    }}
  >
          {i.nombre} x{i.cantidad} = ${i.total}
          <button onClick={() => eliminar(i.id)} style={styles.del}>X</button>
        </div>
      ))}

      <h4>Total: ${totalFinal}</h4>

      <select
  value={tipoPedido}
  onChange={e => setTipoPedido(e.target.value)}
  style={{ ...styles.input, marginTop: 10 }}
>
  <option>Local</option>
  <option>Domicilio</option>
</select>

{tipoPedido === "Domicilio" && (

        <input
          placeholder="Dirección"
          value={direccion}
          onChange={e => setDireccion(e.target.value)}
          style={styles.input}
        />
      )}

      <button
  onClick={crearPedido}
  style={{ ...styles.mainBtn, marginTop: 15 }}
  onTouchStart={(e) => e.target.style.transform = "scale(0.96)"}
  onTouchEnd={(e) => e.target.style.transform = "scale(1)"}
>
  Crear Pedido
</button>

      <h4>Pedidos activos</h4>

      {ventas.map(v => (
  <div
  key={v.id}
  style={{
    ...styles.cardBig,
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: 6
  }}
>

    <button onClick={() => eliminarPedido(v.id)} style={styles.closeBtn}>✖</button>

    {/* ESTADO ARRIBA */}
    <div style={{
      fontSize: 12,
      padding: "2px 6px",
      borderRadius: 4,
      display: "inline-block",
      background: v.estado === "Pagado" ? "#16a34a" : "#f97316",
      color: "white",
      marginBottom: 6
    }}>
      {v.estado}
    </div>

    {/* CLIENTE */}
    <b>{v.cliente}</b>

    {/* TIPO PEDIDO */}
    <div>{v.tipoPedido}</div>

    {/* DIRECCIÓN SOLO SI ES DOMICILIO */}
    {v.tipoPedido === "Domicilio" && (
      <div style={{ fontSize: 12, opacity: 0.8 }}>
        📍 {v.direccion}
      </div>
    )}

    {/* PRODUCTOS */}
    {v.items.map((i, idx) => (
      <div key={idx}>
        {i.nombre} x{i.cantidad}
      </div>
    ))}

    {/* TOTAL */}
    <div>Total: ${v.total}</div>

    {/* BOTONES DE PAGO */}
    {v.estado !== "Pagado" && (
      <div style={{ display: "flex", gap: 10 }}>
        <button
  onClick={() => pagar(v.id, "Efectivo")}
  style={styles.cash}
  onTouchStart={(e) => e.target.style.transform = "scale(0.96)"}
  onTouchEnd={(e) => e.target.style.transform = "scale(1)"}
>
  Efectivo
</button>

        <button
  onClick={() => pagar(v.id, "Transferencia")}
  style={styles.transfer}
  onTouchStart={(e) => e.target.style.transform = "scale(0.96)"}
  onTouchEnd={(e) => e.target.style.transform = "scale(1)"}
>
  Transferencia
</button>
      </div>
    )}

    {/* GUARDAR */}
    <button onClick={() => guardarEnHistorial(v.id)} style={styles.save}>
      Guardar
    </button>

  </div>
))}

      <button onClick={() => setVerHistorial(!verHistorial)} style={styles.histBtn}>
        📋
      </button>

      {verHistorial && (
  <>
    <button onClick={descargarPDF} style={styles.pdfBtn}>
      Descargar PDF
    </button>

<button
  onClick={() => {
    if (window.confirm("¿Seguro que quieres borrar el historial?")) {
      setHistorial([]);
      localStorage.removeItem("historial");

      // 🔥 resetear caja también
      const nuevaCaja = { efectivo: 0, transferencia: 0 };
      setCaja(nuevaCaja);
      localStorage.setItem("caja", JSON.stringify(nuevaCaja));
    }
  }}
  style={styles.cleanBtn}
>
  🗑️
</button>

    {historial.length === 0 ? (
      <div style={{ marginTop: 10 }}>
        No hay ventas guardadas
      </div>
    ) : (
      historial.map(v => (
        <div key={v.id} style={styles.cardBig}>
          <b>{v.cliente}</b>
          <div>{v.fecha}</div>
          <div>Estado: {v.estado}</div>

          {(v.items || []).map((i, idx) => (
  <div key={idx}>
    {i.nombre} x{i.cantidad}
  </div>
))}

          <div>Total: ${v.total}</div>
        </div>
      ))
    )}
  </>
)}

    </div>
  );
}

const styles = {

  app: {
  background: "#0f172a",
  color: "white",
  minHeight: "100vh",
  padding: 16,
  width: "100vw",
  boxSizing: "border-box",
  overflowX: "hidden",
  fontSize: "18px" // 🔥 aumenta todo
},

  title: {
  textAlign: "center",
  fontFamily: "'Creepster', cursive",
  fontSize: "36px",
  color: "#ff3b1f",
  textShadow: "0 2px 0 #8b0000, 0 6px 12px rgba(255, 69, 0, 0.4)",
  transform: "skewX(-5deg)",
  letterSpacing: "2px"
},

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    width: "100%",
    marginBottom: 12
  },

  input: {
  height: 65,
  padding: 10,
  borderRadius: 18,
  fontSize: 18,
  width: "100%",
  textAlign: "center",
  fontWeight: "bold",
  boxSizing: "border-box",
  border: "none",
  background: "#334155",
  color: "white"
},

  select: {
    height: 55,
    padding: 10,
    borderRadius: 16,
    fontSize: 16,
    width: "100%",
    textAlign: "center",
    fontWeight: "bold",
    boxSizing: "border-box"
  },

  btnAdd: {
  background: "linear-gradient(135deg, #22c55e, #16a34a)",
  color: "white",
  padding: 26,
  fontSize: 22,
  borderRadius: 20,
  width: "100%",
  minHeight: 80,
  fontWeight: "bold",
  border: "none",
  boxShadow: "0 6px 20px rgba(34,197,94,0.4)"
},

  mainBtn: {
  background: "linear-gradient(135deg, #f97316, #ea580c)",
  color: "white",
  padding: 22,
  borderRadius: 18,
  width: "100%",
  minHeight: 65,
  fontSize: 20,
  border: "none",
  boxShadow: "0 6px 20px rgba(249,115,22,0.4)"
},

  cash: {
    background: "#16a34a",
    flex: 1,
    padding: 16,
    borderRadius: 16
  },

  transfer: {
    background: "#2563eb",
    flex: 1,
    padding: 16,
    borderRadius: 16
  },

  btnCaja: {
  position: "fixed",
  top: 15,
  right: 15,
  width: 60,
  height: 60,
  borderRadius: "50%",
  background: "#334155",
  border: "none",
  boxShadow: "0 4px 15px rgba(0,0,0,0.5)"
},

cleanBtn: {
  position: "fixed",
  bottom: 90,
  right: 15,
  width: 55,
  height: 55,
  borderRadius: "50%",
  background: "red",
  color: "white",
  border: "none",
  fontSize: 22,
  boxShadow: "0 4px 15px rgba(0,0,0,0.5)"
},

histBtn: {
  position: "fixed",
  bottom: 15,
  right: 15,
  width: 60,
  height: 60,
  borderRadius: "50%",
  background: "#334155",
  border: "none",
  boxShadow: "0 4px 15px rgba(0,0,0,0.5)"
},

  cajaBox: {
    background: "#1e293b",
    padding: 12,
    borderRadius: 10
  },

  card: {
    background: "#1e293b",
    padding: 10,
    marginTop: 6,
    borderRadius: 10
  },

  cardBig: {
  background: "#1e293b",
  padding: 14,
  marginTop: 10,
  borderRadius: 16,
  boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
  border: "1px solid rgba(255,255,255,0.05)"
},

  del: {
    background: "red",
    color: "white",
    padding: 6,
    borderRadius: 8
  },

  save: {
    background: "#64748b",
    padding: 14,
    borderRadius: 12,
    marginTop: 8
  },

  closeBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    background: "red",
    color: "white",
    borderRadius: "50%",
    width: 22,
    height: 22
  },

  pdfBtn: {
    background: "#ef4444",
    padding: 12,
    borderRadius: 10
  }
};

export default App;