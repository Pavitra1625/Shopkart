import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import SearchBar from "../components/SearchBar";
import api from "../services/api";

function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const params = {};

        if (search.trim()) {
          params.search = search.trim();
        }

        if (category) {
          params.category = category;
        }

        const response = await api.get("/products", { params });
        setProducts(response.data.products || []);
      } catch (requestError) {
        console.error(requestError);
        setProducts([]);
        setError("Something went wrong while loading products.");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, category]);

  return (
    <>
      <Navbar />

      <main className="products-page">
        <section className="products-header">
          <div>
            <p className="section-label">SHOPKART STORE</p>
            <h1>Discover Products</h1>
            <p>Browse our products and find something you love.</p>
          </div>
        </section>

        <section className="products-content">
          <SearchBar
            search={search}
            onSearch={setSearch}
            category={category}
            onCategoryChange={setCategory}
          />

          {loading && (
            <div className="products-state">
              <div className="loader"></div>
              <p>Loading products...</p>
            </div>
          )}

          {!loading && error && (
            <div className="products-state error-state">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && products.length === 0 && (
            <div className="products-state">
              <div className="empty-icon">🛍️</div>
              <h2>No products found.</h2>
              <p>Try a different search or category.</p>
            </div>
          )}

          {!loading && !error && products.length > 0 && (
            <div className="products-grid">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}

export default Products;
