/**
 * Menu Page - Browse menu, customize items, add to cart
 * Connected to: /api/menu, CartContext
 */

import React, { useState, useMemo } from 'react';
import { useMenu, useMenuItem } from '../hooks/useApi';
import { useCart } from '../context/CartContext';
import { Search, Filter, Plus, Minus, X, Star, Leaf, Wheat, Check } from 'lucide-react';

// ============================================
// MAIN MENU PAGE
// ============================================

export default function MenuPage() {
  const { categories, toppings, featured, loading, error } = useMenu();
  const { addItem, itemCount } = useCart();

  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ vegetarian: false, glutenFree: false });
  const [selectedItem, setSelectedItem] = useState(null);

  // Filter items based on search and dietary filters
  const filteredCategories = useMemo(() => {
    return categories.map(category => ({
      ...category,
      items: category.items.filter(item => {
        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          if (!item.name.toLowerCase().includes(query) &&
              !item.description?.toLowerCase().includes(query)) {
            return false;
          }
        }
        // Dietary filters
        if (filters.vegetarian && !item.is_vegetarian) return false;
        if (filters.glutenFree && !item.is_gluten_free) return false;
        return true;
      })
    })).filter(cat => cat.items.length > 0);
  }, [categories, searchQuery, filters]);

  // Get items for active category or all
  const displayCategories = activeCategory
    ? filteredCategories.filter(c => c.id === activeCategory)
    : filteredCategories;

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p>Loading menu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <p style={styles.errorText}>Failed to load menu: {error}</p>
        <button onClick={() => window.location.reload()} style={styles.retryButton}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>Our Menu</h1>
        <p style={styles.subtitle}>Fresh ingredients, made to order</p>
      </header>

      {/* Search & Filters */}
      <div style={styles.searchBar}>
        <div style={styles.searchInput}>
          <Search size={20} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.input}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={styles.clearButton}>
              <X size={16} />
            </button>
          )}
        </div>

        <div style={styles.filters}>
          <button
            onClick={() => setFilters(f => ({ ...f, vegetarian: !f.vegetarian }))}
            style={{
              ...styles.filterButton,
              ...(filters.vegetarian ? styles.filterButtonActive : {})
            }}
          >
            <Leaf size={16} />
            Vegetarian
          </button>
          <button
            onClick={() => setFilters(f => ({ ...f, glutenFree: !f.glutenFree }))}
            style={{
              ...styles.filterButton,
              ...(filters.glutenFree ? styles.filterButtonActive : {})
            }}
          >
            <Wheat size={16} />
            Gluten-Free
          </button>
        </div>
      </div>

      {/* Category Navigation */}
      <nav style={styles.categoryNav}>
        <button
          onClick={() => setActiveCategory(null)}
          style={{
            ...styles.categoryButton,
            ...(activeCategory === null ? styles.categoryButtonActive : {})
          }}
        >
          All
        </button>
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            style={{
              ...styles.categoryButton,
              ...(activeCategory === category.id ? styles.categoryButtonActive : {})
            }}
          >
            {category.name}
          </button>
        ))}
      </nav>

      {/* Featured Section */}
      {!activeCategory && !searchQuery && featured.length > 0 && (
        <section style={styles.featuredSection}>
          <h2 style={styles.sectionTitle}>Featured</h2>
          <div style={styles.featuredGrid}>
            {featured.slice(0, 3).map(item => (
              <FeaturedItemCard
                key={item.id}
                item={item}
                onSelect={() => setSelectedItem(item)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Menu Categories */}
      {displayCategories.map(category => (
        <section key={category.id} style={styles.categorySection}>
          <h2 style={styles.sectionTitle}>{category.name}</h2>
          {category.description && (
            <p style={styles.categoryDescription}>{category.description}</p>
          )}
          <div style={styles.itemsGrid}>
            {category.items.map(item => (
              <MenuItemCard
                key={item.id}
                item={item}
                onSelect={() => setSelectedItem(item)}
              />
            ))}
          </div>
        </section>
      ))}

      {/* Empty State */}
      {displayCategories.length === 0 && (
        <div style={styles.emptyState}>
          <p>No items match your search.</p>
          <button onClick={() => { setSearchQuery(''); setFilters({ vegetarian: false, glutenFree: false }); }} style={styles.clearFiltersButton}>
            Clear Filters
          </button>
        </div>
      )}

      {/* Item Customization Modal */}
      {selectedItem && (
        <ItemCustomizationModal
          item={selectedItem}
          toppings={toppings}
          onClose={() => setSelectedItem(null)}
          onAddToCart={(cartItem) => {
            addItem(cartItem);
            setSelectedItem(null);
          }}
        />
      )}

      {/* Cart Preview */}
      {itemCount > 0 && (
        <a href="/cart" style={styles.cartPreview}>
          <span style={styles.cartCount}>{itemCount}</span>
          View Cart
        </a>
      )}
    </div>
  );
}

// ============================================
// MENU ITEM CARD
// ============================================

function MenuItemCard({ item, onSelect }) {
  return (
    <div style={styles.itemCard} onClick={onSelect}>
      {item.image_url && (
        <div style={styles.itemImageContainer}>
          <img src={item.image_url} alt={item.name} style={styles.itemImage} />
          {item.is_popular && <span style={styles.popularBadge}>Popular</span>}
        </div>
      )}
      <div style={styles.itemInfo}>
        <div style={styles.itemHeader}>
          <h3 style={styles.itemName}>{item.name}</h3>
          <div style={styles.dietaryIcons}>
            {item.is_vegetarian && <Leaf size={14} style={{ color: '#22c55e' }} title="Vegetarian" />}
            {item.is_gluten_free && <Wheat size={14} style={{ color: '#f59e0b' }} title="Gluten-Free" />}
          </div>
        </div>
        <p style={styles.itemDescription}>{item.description}</p>
        <div style={styles.itemFooter}>
          <span style={styles.itemPrice}>
            ${parseFloat(item.base_price).toFixed(2)}
            {item.variants?.length > 1 && '+'}
          </span>
          {item.avg_rating > 0 && (
            <span style={styles.itemRating}>
              <Star size={14} fill="#f59e0b" stroke="#f59e0b" />
              {item.avg_rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// FEATURED ITEM CARD
// ============================================

function FeaturedItemCard({ item, onSelect }) {
  return (
    <div style={styles.featuredCard} onClick={onSelect}>
      <div style={styles.featuredImageContainer}>
        <img
          src={item.image_url || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400'}
          alt={item.name}
          style={styles.featuredImage}
        />
        <div style={styles.featuredOverlay}>
          <span style={styles.featuredBadge}>Featured</span>
        </div>
      </div>
      <div style={styles.featuredInfo}>
        <h3 style={styles.featuredName}>{item.name}</h3>
        <p style={styles.featuredPrice}>${parseFloat(item.base_price).toFixed(2)}</p>
      </div>
    </div>
  );
}

// ============================================
// ITEM CUSTOMIZATION MODAL
// ============================================

function ItemCustomizationModal({ item, toppings, onClose, onAddToCart }) {
  const [selectedVariant, setSelectedVariant] = useState(
    item.variants?.find(v => v.is_default)?.id || item.variants?.[0]?.id || null
  );
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Calculate price
  const basePrice = parseFloat(item.base_price);
  const variantPrice = item.variants?.find(v => v.id === selectedVariant)?.price_modifier || 0;
  const toppingsPrice = selectedToppings.reduce((sum, t) => {
    const topping = toppings.find(top => top.id === t.id);
    return sum + (parseFloat(topping?.price || 0) * (t.quantity || 1));
  }, 0);
  const unitPrice = basePrice + parseFloat(variantPrice) + toppingsPrice;
  const totalPrice = unitPrice * quantity;

  // Get variant display
  const selectedVariantData = item.variants?.find(v => v.id === selectedVariant);

  // Toggle topping
  const toggleTopping = (toppingId) => {
    setSelectedToppings(prev => {
      const existing = prev.find(t => t.id === toppingId);
      if (existing) {
        return prev.filter(t => t.id !== toppingId);
      }
      return [...prev, { id: toppingId, quantity: 1, modifier_type: 'add' }];
    });
  };

  // Group toppings by category
  const toppingsByCategory = toppings.reduce((acc, topping) => {
    const category = topping.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(topping);
    return acc;
  }, {});

  const handleAddToCart = () => {
    const cartItem = {
      item_id: item.id,
      variant_id: selectedVariant,
      item_name: item.name,
      variant_name: selectedVariantData?.name,
      unit_price: unitPrice,
      quantity,
      toppings: selectedToppings.map(t => ({
        ...t,
        name: toppings.find(top => top.id === t.id)?.name
      })),
      special_instructions: specialInstructions,
      image_url: item.image_url
    };
    onAddToCart(cartItem);
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={styles.modalClose}>
          <X size={24} />
        </button>

        {/* Item Header */}
        <div style={styles.modalHeader}>
          {item.image_url && (
            <img src={item.image_url} alt={item.name} style={styles.modalImage} />
          )}
          <h2 style={styles.modalTitle}>{item.name}</h2>
          <p style={styles.modalDescription}>{item.description}</p>
        </div>

        <div style={styles.modalBody}>
          {/* Size/Variant Selection */}
          {item.variants && item.variants.length > 1 && (
            <div style={styles.optionSection}>
              <h3 style={styles.optionTitle}>Choose Size</h3>
              <div style={styles.variantGrid}>
                {item.variants.map(variant => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant.id)}
                    style={{
                      ...styles.variantButton,
                      ...(selectedVariant === variant.id ? styles.variantButtonActive : {})
                    }}
                  >
                    <span style={styles.variantName}>{variant.name}</span>
                    {variant.serves && <span style={styles.variantServes}>{variant.serves}</span>}
                    <span style={styles.variantPrice}>
                      {variant.price_modifier > 0 ? `+$${parseFloat(variant.price_modifier).toFixed(2)}` : 'Base'}
                    </span>
                    {selectedVariant === variant.id && (
                      <Check size={16} style={styles.variantCheck} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Toppings Selection */}
          {item.allows_customization && toppings.length > 0 && (
            <div style={styles.optionSection}>
              <h3 style={styles.optionTitle}>Add Toppings</h3>
              {Object.entries(toppingsByCategory).map(([category, categoryToppings]) => (
                <div key={category} style={styles.toppingCategory}>
                  <h4 style={styles.toppingCategoryTitle}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}s
                  </h4>
                  <div style={styles.toppingGrid}>
                    {categoryToppings.map(topping => {
                      const isSelected = selectedToppings.some(t => t.id === topping.id);
                      return (
                        <button
                          key={topping.id}
                          onClick={() => toggleTopping(topping.id)}
                          style={{
                            ...styles.toppingButton,
                            ...(isSelected ? styles.toppingButtonActive : {})
                          }}
                        >
                          <span>{topping.name}</span>
                          {topping.price > 0 && (
                            <span style={styles.toppingPrice}>+${parseFloat(topping.price).toFixed(2)}</span>
                          )}
                          {isSelected && <Check size={14} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Special Instructions */}
          <div style={styles.optionSection}>
            <h3 style={styles.optionTitle}>Special Instructions</h3>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Any special requests?"
              style={styles.instructionsInput}
              rows={2}
            />
          </div>
        </div>

        {/* Footer with Quantity and Add to Cart */}
        <div style={styles.modalFooter}>
          <div style={styles.quantityControl}>
            <button
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              style={styles.quantityButton}
            >
              <Minus size={20} />
            </button>
            <span style={styles.quantityValue}>{quantity}</span>
            <button
              onClick={() => setQuantity(q => q + 1)}
              style={styles.quantityButton}
            >
              <Plus size={20} />
            </button>
          </div>

          <button onClick={handleAddToCart} style={styles.addToCartButton}>
            Add to Cart - ${totalPrice.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// STYLES
// ============================================

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px 16px 120px',
  },

  // Loading & Error
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: '16px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e5e7eb',
    borderTopColor: '#dc2626',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  errorContainer: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  errorText: {
    color: '#dc2626',
    marginBottom: '16px',
  },
  retryButton: {
    padding: '12px 24px',
    background: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },

  // Header
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  title: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '18px',
    color: '#6b7280',
  },

  // Search & Filters
  searchBar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '24px',
  },
  searchInput: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '16px',
    color: '#9ca3af',
  },
  input: {
    width: '100%',
    padding: '14px 44px',
    fontSize: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    outline: 'none',
  },
  clearButton: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#9ca3af',
  },
  filters: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  filterButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '20px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  filterButtonActive: {
    background: '#dcfce7',
    borderColor: '#22c55e',
    color: '#15803d',
  },

  // Category Navigation
  categoryNav: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    paddingBottom: '8px',
    marginBottom: '32px',
    WebkitOverflowScrolling: 'touch',
  },
  categoryButton: {
    padding: '10px 20px',
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  categoryButtonActive: {
    background: '#dc2626',
    borderColor: '#dc2626',
    color: 'white',
  },

  // Sections
  featuredSection: {
    marginBottom: '48px',
  },
  categorySection: {
    marginBottom: '48px',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '8px',
  },
  categoryDescription: {
    color: '#6b7280',
    marginBottom: '16px',
  },

  // Grids
  featuredGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  },
  itemsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
  },

  // Item Card
  itemCard: {
    background: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  itemImageContainer: {
    position: 'relative',
    height: '160px',
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  popularBadge: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    padding: '4px 10px',
    background: '#dc2626',
    color: 'white',
    fontSize: '12px',
    fontWeight: '600',
    borderRadius: '12px',
  },
  itemInfo: {
    padding: '16px',
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
  },
  itemName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  dietaryIcons: {
    display: 'flex',
    gap: '4px',
  },
  itemDescription: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '12px',
    lineHeight: 1.4,
  },
  itemFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#dc2626',
  },
  itemRating: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '14px',
    color: '#6b7280',
  },

  // Featured Card
  featuredCard: {
    position: 'relative',
    borderRadius: '16px',
    overflow: 'hidden',
    cursor: 'pointer',
  },
  featuredImageContainer: {
    position: 'relative',
    height: '200px',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  featuredOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.7))',
  },
  featuredBadge: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    padding: '6px 12px',
    background: '#dc2626',
    color: 'white',
    fontSize: '12px',
    fontWeight: '600',
    borderRadius: '6px',
  },
  featuredInfo: {
    position: 'absolute',
    bottom: '16px',
    left: '16px',
    right: '16px',
  },
  featuredName: {
    color: 'white',
    fontSize: '20px',
    fontWeight: '700',
    margin: 0,
    marginBottom: '4px',
  },
  featuredPrice: {
    color: '#fca5a5',
    fontSize: '18px',
    fontWeight: '600',
    margin: 0,
  },

  // Modal
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    position: 'relative',
    background: 'white',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalClose: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    zIndex: 1,
  },
  modalHeader: {
    textAlign: 'center',
    padding: '20px 20px 0',
  },
  modalImage: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
    borderRadius: '12px',
    marginBottom: '16px',
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0,
    marginBottom: '8px',
  },
  modalDescription: {
    color: '#6b7280',
    fontSize: '14px',
  },
  modalBody: {
    padding: '20px',
  },
  modalFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 20px',
    borderTop: '1px solid #e5e7eb',
    background: '#f9fafb',
  },

  // Options
  optionSection: {
    marginBottom: '24px',
  },
  optionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '12px',
  },
  variantGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
  },
  variantButton: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '12px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    background: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  variantButtonActive: {
    borderColor: '#dc2626',
    background: '#fef2f2',
  },
  variantName: {
    fontWeight: '600',
    color: '#1f2937',
  },
  variantServes: {
    fontSize: '12px',
    color: '#6b7280',
  },
  variantPrice: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#dc2626',
  },
  variantCheck: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    color: '#dc2626',
  },

  // Toppings
  toppingCategory: {
    marginBottom: '16px',
  },
  toppingCategoryTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: '8px',
    textTransform: 'uppercase',
  },
  toppingGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  toppingButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '20px',
    background: 'white',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  toppingButtonActive: {
    borderColor: '#dc2626',
    background: '#fef2f2',
    color: '#dc2626',
  },
  toppingPrice: {
    fontSize: '12px',
    color: '#6b7280',
  },

  // Instructions
  instructionsInput: {
    width: '100%',
    padding: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    resize: 'none',
  },

  // Quantity
  quantityControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: '#f3f4f6',
    borderRadius: '8px',
    padding: '4px',
  },
  quantityButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    border: 'none',
    background: 'white',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  quantityValue: {
    fontSize: '18px',
    fontWeight: '600',
    minWidth: '30px',
    textAlign: 'center',
  },

  // Add to Cart
  addToCartButton: {
    flex: 1,
    padding: '14px 24px',
    background: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },

  // Cart Preview
  cartPreview: {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 32px',
    background: '#1f2937',
    color: 'white',
    borderRadius: '30px',
    textDecoration: 'none',
    fontWeight: '600',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  },
  cartCount: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    background: '#dc2626',
    borderRadius: '50%',
    fontSize: '14px',
    fontWeight: '700',
  },

  // Empty State
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#6b7280',
  },
  clearFiltersButton: {
    marginTop: '16px',
    padding: '10px 20px',
    background: '#f3f4f6',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};

// Add keyframe animation for spinner
const styleSheet = document.styleSheets[0];
try {
  styleSheet.insertRule(`
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `, styleSheet.cssRules.length);
} catch (e) {}
