// admin/widget-jersey-ia.js
//
// Widget personalizado y simple para Decap CMS: es un campo de texto normal
// (URL de la imagen) con un botón "Autocompletar con IA" debajo que te
// MUESTRA el nombre y equipo sugeridos (no los escribe solo, para no romper
// la compatibilidad con tus datos ya guardados). Copias lo que te sirva.
//
// Se registra como widget: "ayudaIA" — se usa en config.yml para el campo "img".

var AyudaIAControl = createClass({
  getInitialState: function () {
    return { cargando: false, mensaje: "", sugNombre: "", sugEquipo: "" };
  },

  handleChange: function (e) {
    this.props.onChange(e.target.value);
  },

  autocompletar: function () {
    var self = this;
    var url = this.props.value || "";
    if (!url) {
      this.setState({ mensaje: "Pega primero el link de la imagen arriba." });
      return;
    }
    this.setState({ cargando: true, mensaje: "", sugNombre: "", sugEquipo: "" });

    fetch("/.netlify/functions/analizar-imagen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: url }),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (r) {
        if (!r.ok) {
          self.setState({
            cargando: false,
            mensaje:
              "[" + (r.data.version || "SIN VERSION") + "] " +
              "Error: " +
              (r.data.error || "no se pudo analizar la imagen") +
              (r.data.modeloUsado ? " | Modelo: " + r.data.modeloUsado : "") +
              (r.data.detail ? " | Detalle: " + r.data.detail : ""),
          });
          return;
        }
        self.setState({
          cargando: false,
          mensaje: "Toca cada sugerencia para copiarla, y pégala en el campo correspondiente abajo.",
          sugNombre: r.data.nombre || "",
          sugEquipo: r.data.equipo || "",
        });
      })
      .catch(function (err) {
        self.setState({ cargando: false, mensaje: "Error de red: " + err.message });
      });
  },

  copiar: function (texto) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(texto);
      this.setState({ mensaje: "¡Copiado! Pégalo (Cmd/Ctrl+V) en el campo correspondiente." });
    }
  },

  render: function () {
    var self = this;
    var url = this.props.value || "";

    return h(
      "div",
      null,
      h("input", {
        id: this.props.forID,
        type: "text",
        value: url,
        placeholder: "https://...",
        className: this.props.classNameWrapper,
        onChange: this.handleChange,
      }),

      url
        ? h("img", { src: url, style: { maxWidth: "160px", display: "block", margin: "8px 0", borderRadius: "4px" } })
        : null,

      h(
        "button",
        {
          type: "button",
          disabled: this.state.cargando,
          onClick: function (e) {
            e.preventDefault();
            self.autocompletar();
          },
          style: { margin: "6px 0", padding: "8px 14px", cursor: "pointer" },
        },
        this.state.cargando ? "Analizando..." : "🤖 Autocompletar con IA"
      ),

      this.state.mensaje
        ? h("div", { style: { fontSize: "12px", color: "#555", marginBottom: "8px" } }, this.state.mensaje)
        : null,

      this.state.sugNombre
        ? h(
            "div",
            { style: { border: "1px dashed #999", borderRadius: "6px", padding: "8px", marginBottom: "6px" } },
            h("div", { style: { fontSize: "12px", color: "#777" } }, "Nombre sugerido (toca para copiar):"),
            h(
              "div",
              {
                style: { cursor: "pointer", fontWeight: "bold" },
                onClick: function () {
                  self.copiar(self.state.sugNombre);
                },
              },
              self.state.sugNombre
            )
          )
        : null,

      this.state.sugEquipo
        ? h(
            "div",
            { style: { border: "1px dashed #999", borderRadius: "6px", padding: "8px" } },
            h("div", { style: { fontSize: "12px", color: "#777" } }, "Equipo sugerido (toca para copiar):"),
            h(
              "div",
              {
                style: { cursor: "pointer", fontWeight: "bold" },
                onClick: function () {
                  self.copiar(self.state.sugEquipo);
                },
              },
              self.state.sugEquipo
            )
          )
        : null
    );
  },
});

var AyudaIAPreview = createClass({
  render: function () {
    return this.props.value ? h("img", { src: this.props.value, style: { maxWidth: "120px" } }) : null;
  },
});

CMS.registerWidget("ayudaIA", AyudaIAControl, AyudaIAPreview);
