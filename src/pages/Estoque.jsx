import { useState } from "react";
import { useSircData } from "../data/sircStore";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  ChevronDown,
  History,
  MapPin,
  Package,
  Plus,
  Search,
  X,
} from "lucide-react";
import "./estoque.css";

const initialProducts = [
  { id: "SIRC-0001", name: "Caixa organizadora", category: "Armazenagem", quantity: 120, minimum: 30, location: "A-01-03" },
  { id: "SIRC-0002", name: "Leitor portátil RFID", category: "Equipamentos", quantity: 8, minimum: 5, location: "B-02-01" },
  { id: "SIRC-0003", name: "Etiqueta RFID UHF", category: "Identificação", quantity: 420, minimum: 100, location: "C-01-02" },
  { id: "SIRC-0004", name: "Bobina stretch", category: "Embalagem", quantity: 14, minimum: 20, location: "A-03-01" },
  { id: "SIRC-0005", name: "Palete plástico", category: "Armazenagem", quantity: 45, minimum: 15, location: "A-02-04" },
  { id: "SIRC-0006", name: "Caixa de papelão M", category: "Embalagem", quantity: 65, minimum: 25, location: "A-03-02" },
];

const emptyProduct = {
  name: "",
  category: "Armazenagem",
  quantity: "",
  minimum: "",
  location: "",
};

const emptyMovement = {
  type: "entrada",
  quantity: "",
  note: "",
};

export default function Estoque() {
const {
  products,
  setProducts,
  movements,
  setMovements,
} = useSircData();

  const [activeTab, setActiveTab] = useState("produtos");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");

  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState(emptyProduct);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [movementForm, setMovementForm] = useState(emptyMovement);
  const [movementError, setMovementError] = useState("");

  const categories = [
    ...new Set(products.map((product) => product.category)),
  ].sort();

  const filteredProducts = products.filter((product) => {
    const text =
      `${product.id} ${product.name} ${product.category} ${product.location}`
        .toLowerCase();

    return (
      text.includes(search.toLowerCase()) &&
      (category === "Todas" || product.category === category)
    );
  });

  const totalUnits = products.reduce(
    (total, product) => total + product.quantity,
    0
  );

  const lowStock = products.filter(
    (product) => product.quantity <= product.minimum
  ).length;

  function handleProductChange(event) {
    const { name, value } = event.target;

    setProductForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleProductSubmit(event) {
    event.preventDefault();

    const product = {
      id: `SIRC-${String(Date.now()).slice(-8)}`,
      name: productForm.name.trim(),
      category: productForm.category,
      quantity: Number(productForm.quantity),
      minimum: Number(productForm.minimum),
      location: productForm.location.trim(),
    };

    setProducts((current) => [product, ...current]);
    setProductForm(emptyProduct);
    setShowProductForm(false);
    setActiveTab("produtos");
  }

  function openMovement(product, type) {
    setSelectedProduct(product);
    setMovementForm({ ...emptyMovement, type });
    setMovementError("");
  }

  function handleMovementSubmit(event) {
    event.preventDefault();

    const quantity = Number(movementForm.quantity);

    if (!Number.isSafeInteger(quantity) || quantity <= 0) {
      setMovementError("Informe uma quantidade inteira maior que zero.");
      return;
    }

    // Consultamos o saldo mais recente antes de registrar a saída.
    const currentProduct = products.find(
      (product) => product.id === selectedProduct.id
    );

    if (!currentProduct) {
      setMovementError("Produto não encontrado no estoque.");
      return;
    }

    if (
      movementForm.type === "saida" &&
      quantity > currentProduct.quantity
    ) {
      setMovementError(
        `Saldo insuficiente. Quantidade disponível: ${currentProduct.quantity}.`
      );
      return;
    }

    const updatedQuantity =
      movementForm.type === "entrada"
        ? currentProduct.quantity + quantity
        : currentProduct.quantity - quantity;

    setProducts((current) =>
      current.map((product) =>
        product.id === currentProduct.id
          ? { ...product, quantity: updatedQuantity }
          : product
      )
    );

    const movement = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      productId: currentProduct.id,
      productName: currentProduct.name,
      type: movementForm.type,
      quantity,
      note: movementForm.note.trim() || "Movimentação manual",
      date: new Date().toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }),
    };

    setMovements((current) => [movement, ...current]);
    setSelectedProduct(null);
    setMovementForm(emptyMovement);
    setMovementError("");
    setActiveTab("historico");
  }

  return (
    <section className="stock-page">
      <header className="stock-page-header">
        <div>
          <span className="stock-eyebrow">GESTÃO DE INVENTÁRIO</span>
          <h2>Controle de estoque</h2>
          <p>
            Gerencie produtos, quantidades e movimentações do armazém.
          </p>
        </div>

        <button
          className="stock-primary-button"
          onClick={() => setShowProductForm(true)}
        >
          <Plus size={18} />
          Novo produto
        </button>
      </header>

      <section className="stock-metrics">
        <article className="stock-metric-card">
          <div className="stock-metric-icon blue"><Package size={21} /></div>
          <div>
            <span>Produtos cadastrados</span>
            <strong>{products.length}</strong>
            <small>Tipos de produtos</small>
          </div>
        </article>

        <article className="stock-metric-card">
          <div className="stock-metric-icon purple"><Boxes size={21} /></div>
          <div>
            <span>Unidades em estoque</span>
            <strong>{totalUnits.toLocaleString("pt-BR")}</strong>
            <small>Saldo total dos produtos</small>
          </div>
        </article>

        <article className="stock-metric-card">
          <div className="stock-metric-icon orange"><AlertTriangle size={21} /></div>
          <div>
            <span>Estoque baixo</span>
            <strong>{String(lowStock).padStart(2, "0")}</strong>
            <small>No limite ou abaixo do mínimo</small>
          </div>
        </article>

        <article className="stock-metric-card">
          <div className="stock-metric-icon green"><CheckCircle2 size={21} /></div>
          <div>
            <span>Movimentações</span>
            <strong>{movements.length}</strong>
            <small>Registradas nesta sessão</small>
          </div>
        </article>
      </section>

      <div className="stock-tabs">
        <button
          className={activeTab === "produtos" ? "active" : ""}
          onClick={() => setActiveTab("produtos")}
        >
          <Boxes size={17} />
          Produtos
        </button>

        <button
          className={activeTab === "historico" ? "active" : ""}
          onClick={() => setActiveTab("historico")}
        >
          <History size={17} />
          Histórico
          <span>{movements.length}</span>
        </button>
      </div>

      <section className="stock-table-panel">
        {activeTab === "produtos" ? (
          <>
            <div className="stock-table-heading">
              <div>
                <h3>Produtos cadastrados</h3>
                <p>Consulte os saldos e registre entradas e saídas.</p>
              </div>
              <span className="stock-record-count">
                {filteredProducts.length} produtos
              </span>
            </div>

            <div className="stock-filters">
              <label className="stock-search">
                <Search size={18} />
                <input
                  type="search"
                  placeholder="Buscar produto, código ou local..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Buscar produtos"
                />
              </label>

              <label className="stock-category-filter">
                <span>Categoria</span>
                <span className="stock-select-wrapper">
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    aria-label="Filtrar categoria"
                  >
                    <option value="Todas">Todas as categorias</option>
                    {categories.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} />
                </span>
              </label>
            </div>

            <div className="stock-table-scroll">
              <table className="stock-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Categoria</th>
                    <th>Saldo / mínimo</th>
                    <th>Localização</th>
                    <th>Status</th>
                    <th>Movimentar</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.map((product) => {
                    const isLow = product.quantity <= product.minimum;

                    return (
                      <tr key={product.id}>
                        <td>
                          <div className="stock-product-cell">
                            <div className="stock-product-icon">
                              <Package size={19} />
                            </div>
                            <div>
                              <strong>{product.name}</strong>
                              <span>{product.id}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="stock-category-tag">
                            {product.category}
                          </span>
                        </td>

                        <td>
                          <div className="stock-quantity">
                            <strong>
                              {product.quantity.toLocaleString("pt-BR")}
                            </strong>
                            <span>Mínimo: {product.minimum}</span>
                          </div>
                        </td>

                        <td>
                          <span className="stock-location">
                            <MapPin size={14} />
                            {product.location}
                          </span>
                        </td>

                        <td>
                          <span className={`stock-status ${isLow ? "low" : "available"}`}>
                            <span />
                            {isLow ? "Estoque baixo" : "Disponível"}
                          </span>
                        </td>

                        <td>
                          <div className="stock-row-actions">
                            <button
                              className="stock-action-btn entry"
                              title={`Registrar entrada de ${product.name}`}
                              onClick={() => openMovement(product, "entrada")}
                            >
                              <ArrowDownLeft size={15} />
                              Entrada
                            </button>
                            <button
                              className="stock-action-btn exit"
                              title={`Registrar saída de ${product.name}`}
                              onClick={() => openMovement(product, "saida")}
                            >
                              <ArrowUpRight size={15} />
                              Saída
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredProducts.length === 0 && (
                <div className="stock-empty-state">
                  <Search size={26} />
                  <strong>Nenhum produto encontrado</strong>
                  <p>Altere a pesquisa ou os filtros.</p>
                  <button onClick={() => { setSearch(""); setCategory("Todas"); }}>
                    Limpar filtros
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="stock-table-heading">
              <div>
                <h3>Histórico de movimentações</h3>
                <p>Entradas e saídas registradas nesta sessão.</p>
              </div>
              <span className="stock-record-count">
                {movements.length} registros
              </span>
            </div>

            {movements.length > 0 ? (
              <div className="stock-table-scroll">
                <table className="stock-table stock-history-table">
                  <thead>
                    <tr>
                      <th>Data e hora</th>
                      <th>Produto</th>
                      <th>Tipo</th>
                      <th>Quantidade</th>
                      <th>Observação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((movement) => (
                      <tr key={movement.id}>
                        <td>{movement.date}</td>
                        <td>
                          <div className="stock-product-cell">
                            <div className="stock-product-icon">
                              <Package size={18} />
                            </div>
                            <div>
                              <strong>{movement.productName}</strong>
                              <span>{movement.productId}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`stock-movement-type ${movement.type}`}>
                            {movement.type === "entrada" ? (
                              <ArrowDownLeft size={14} />
                            ) : (
                              <ArrowUpRight size={14} />
                            )}
                            {movement.type === "entrada" ? "Entrada" : "Saída"}
                          </span>
                        </td>
                        <td>
                          <strong>
                            {movement.type === "entrada" ? "+" : "−"}
                            {movement.quantity}
                          </strong>
                        </td>
                        <td>{movement.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="stock-empty-state">
                <History size={28} />
                <strong>Nenhuma movimentação registrada</strong>
                <p>Registre uma entrada ou saída na aba Produtos para começar o histórico.</p>
                <button onClick={() => setActiveTab("produtos")}>
                  Ir para produtos
                </button>
              </div>
            )}
          </>
        )}

        <footer className="stock-table-footer">
          <span>
            <span className="stock-footer-dot" />
            Dados temporários desta sessão.
          </span>
          <span>Integração com banco de dados pendente</span>
        </footer>
      </section>

      {showProductForm && (
        <div
          className="stock-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowProductForm(false);
            }
          }}
        >
          <section className="stock-modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
            <header className="stock-modal-header">
              <div>
                <span className="stock-eyebrow">CADASTRO DE INVENTÁRIO</span>
                <h3 id="product-modal-title">Novo produto</h3>
                <p>Informe os dados do produto.</p>
              </div>
              <button className="stock-close-button" onClick={() => setShowProductForm(false)} aria-label="Fechar">
                <X size={19} />
              </button>
            </header>

            <form onSubmit={handleProductSubmit}>
              <label className="stock-form-field">
                Nome do produto
                <input name="name" value={productForm.name} onChange={handleProductChange} maxLength={100} placeholder="Ex.: Caixa de papelão" required />
              </label>

              <label className="stock-form-field">
                Categoria
                <select name="category" value={productForm.category} onChange={handleProductChange} required>
                  <option>Armazenagem</option>
                  <option>Equipamentos</option>
                  <option>Identificação</option>
                  <option>Embalagem</option>
                  <option>Outros</option>
                </select>
              </label>

              <div className="stock-form-row">
                <label className="stock-form-field">
                  Quantidade inicial
                  <input type="number" name="quantity" min="0" step="1" value={productForm.quantity} onChange={handleProductChange} required />
                </label>
                <label className="stock-form-field">
                  Estoque mínimo
                  <input type="number" name="minimum" min="0" step="1" value={productForm.minimum} onChange={handleProductChange} required />
                </label>
              </div>

              <label className="stock-form-field">
                Localização no armazém
                <input name="location" value={productForm.location} onChange={handleProductChange} maxLength={40} placeholder="Ex.: A-01-03" required />
              </label>

              <div className="stock-modal-note">
                <AlertTriangle size={16} />
                <span>O código é provisório. A associação de etiquetas RFID será integrada futuramente.</span>
              </div>

              <div className="stock-modal-actions">
                <button type="button" className="stock-secondary-button" onClick={() => { setShowProductForm(false); setProductForm(emptyProduct); }}>
                  Cancelar
                </button>
                <button type="submit" className="stock-primary-button">
                  <Plus size={17} /> Cadastrar produto
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {selectedProduct && (
        <div
          className="stock-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedProduct(null);
          }}
        >
          <section className="stock-modal" role="dialog" aria-modal="true" aria-labelledby="movement-modal-title">
            <header className="stock-modal-header">
              <div>
                <span className="stock-eyebrow">MOVIMENTAÇÃO DE ESTOQUE</span>
                <h3 id="movement-modal-title">
                  {movementForm.type === "entrada" ? "Registrar entrada" : "Registrar saída"}
                </h3>
                <p>{selectedProduct.name} · {selectedProduct.id}</p>
              </div>
              <button className="stock-close-button" onClick={() => setSelectedProduct(null)} aria-label="Fechar">
                <X size={19} />
              </button>
            </header>

            <form onSubmit={handleMovementSubmit}>
              <div className="stock-movement-switch">
                <button
                  type="button"
                  className={movementForm.type === "entrada" ? "active entry" : ""}
                  onClick={() => { setMovementForm((current) => ({ ...current, type: "entrada" })); setMovementError(""); }}
                >
                  <ArrowDownLeft size={17} /> Entrada
                </button>
                <button
                  type="button"
                  className={movementForm.type === "saida" ? "active exit" : ""}
                  onClick={() => { setMovementForm((current) => ({ ...current, type: "saida" })); setMovementError(""); }}
                >
                  <ArrowUpRight size={17} /> Saída
                </button>
              </div>

              <div className="stock-current-balance">
                <span>Saldo atual</span>
                <strong>
                  {products.find((product) => product.id === selectedProduct.id)?.quantity ?? 0}
                  <small> unidades</small>
                </strong>
              </div>

              <label className="stock-form-field">
                Quantidade
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={movementForm.quantity}
                  onChange={(event) => { setMovementForm((current) => ({ ...current, quantity: event.target.value })); setMovementError(""); }}
                  placeholder="Informe a quantidade"
                  required
                />
              </label>

              <label className="stock-form-field">
                Observação (opcional)
                <input
                  value={movementForm.note}
                  onChange={(event) => setMovementForm((current) => ({ ...current, note: event.target.value }))}
                  maxLength={150}
                  placeholder="Ex.: reposição, separação de pedido..."
                />
              </label>

              {movementError && (
                <p className="stock-movement-error" role="alert">
                  {movementError}
                </p>
              )}

              <div className="stock-modal-actions">
                <button type="button" className="stock-secondary-button" onClick={() => setSelectedProduct(null)}>
                  Cancelar
                </button>
                <button type="submit" className="stock-primary-button">
                  {movementForm.type === "entrada" ? (
                    <ArrowDownLeft size={17} />
                  ) : (
                    <ArrowUpRight size={17} />
                  )}
                  Confirmar {movementForm.type}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
