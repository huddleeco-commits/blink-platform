/**
 * Checkout Page - Multi-step checkout flow with Stripe
 * Steps: Cart Review → Delivery/Pickup → Payment → Confirmation
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from '../context/CartContext';
import { useCreateOrder, useAddresses } from '../hooks/useApi';
import { promoApi } from '../lib/api';
import {
  ShoppingBag, MapPin, CreditCard, Check, ChevronRight, ChevronLeft,
  Trash2, Plus, Minus, Clock, Store, Truck, Tag, AlertCircle, Loader
} from 'lucide-react';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// ============================================
// MAIN CHECKOUT PAGE
// ============================================

export default function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutFlow />
    </Elements>
  );
}

function CheckoutFlow() {
  const navigate = useNavigate();
  const cart = useCart();
  const { createOrder, confirmPayment, loading: orderLoading, error: orderError } = useCreateOrder();
  const stripe = useStripe();
  const elements = useElements();

  const [step, setStep] = useState(1); // 1: Cart, 2: Delivery, 3: Payment, 4: Confirmation
  const [orderData, setOrderData] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Redirect if cart is empty
  useEffect(() => {
    if (cart.isEmpty && step === 1) {
      navigate('/menu');
    }
  }, [cart.isEmpty, step, navigate]);

  // Step labels
  const steps = [
    { number: 1, label: 'Review Cart', icon: ShoppingBag },
    { number: 2, label: 'Delivery', icon: MapPin },
    { number: 3, label: 'Payment', icon: CreditCard },
    { number: 4, label: 'Confirmed', icon: Check }
  ];

  const handleProceedToDelivery = () => {
    if (!cart.isEmpty) {
      setStep(2);
    }
  };

  const handleProceedToPayment = () => {
    // Validate delivery info
    if (cart.orderType === 'delivery' && !cart.deliveryAddress) {
      alert('Please select or add a delivery address');
      return;
    }
    setStep(3);
  };

  const handlePlaceOrder = async () => {
    if (!stripe || !elements) return;

    setProcessing(true);
    setPaymentError(null);

    try {
      // Create order on backend
      const orderPayload = {
        items: cart.items.map(item => ({
          item_id: item.item_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          toppings: item.toppings,
          special_instructions: item.special_instructions
        })),
        order_type: cart.orderType,
        delivery_address: cart.deliveryAddress,
        special_instructions: cart.specialInstructions,
        promo_code: cart.promoCode,
        tip_amount: cart.tip,
        payment_method: 'card'
      };

      const orderResponse = await createOrder(orderPayload);

      if (!orderResponse.success) {
        throw new Error(orderResponse.error || 'Failed to create order');
      }

      // Process payment with Stripe
      if (orderResponse.payment?.requires_payment) {
        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
          orderResponse.payment.client_secret,
          {
            payment_method: {
              card: elements.getElement(CardElement)
            }
          }
        );

        if (stripeError) {
          throw new Error(stripeError.message);
        }

        // Confirm payment on backend
        await confirmPayment(orderResponse.order.id, paymentIntent.id);
      }

      // Success!
      setOrderData(orderResponse.order);
      cart.clearCart();
      setStep(4);

    } catch (error) {
      setPaymentError(error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Progress Steps */}
      <div style={styles.progressBar}>
        {steps.map((s, i) => (
          <React.Fragment key={s.number}>
            <div style={{
              ...styles.stepItem,
              ...(step >= s.number ? styles.stepItemActive : {})
            }}>
              <div style={{
                ...styles.stepIcon,
                ...(step >= s.number ? styles.stepIconActive : {}),
                ...(step > s.number ? styles.stepIconComplete : {})
              }}>
                {step > s.number ? <Check size={18} /> : <s.icon size={18} />}
              </div>
              <span style={styles.stepLabel}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                ...styles.stepConnector,
                ...(step > s.number ? styles.stepConnectorActive : {})
              }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <div style={styles.content}>
        {step === 1 && (
          <CartReviewStep
            cart={cart}
            onNext={handleProceedToDelivery}
          />
        )}

        {step === 2 && (
          <DeliveryStep
            cart={cart}
            onBack={() => setStep(1)}
            onNext={handleProceedToPayment}
          />
        )}

        {step === 3 && (
          <PaymentStep
            cart={cart}
            onBack={() => setStep(2)}
            onSubmit={handlePlaceOrder}
            processing={processing}
            error={paymentError || orderError}
          />
        )}

        {step === 4 && (
          <ConfirmationStep
            order={orderData}
            onTrackOrder={() => navigate(`/order/${orderData.order_number}`)}
            onNewOrder={() => navigate('/menu')}
          />
        )}
      </div>
    </div>
  );
}

// ============================================
// STEP 1: CART REVIEW
// ============================================

function CartReviewStep({ cart, onNext }) {
  const [promoInput, setPromoInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState(null);

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;

    setPromoLoading(true);
    setPromoError(null);

    try {
      const response = await promoApi.validateCode(promoInput, cart.subtotal);
      if (response.success && response.valid) {
        cart.setPromo(response.code, response.discount);
      } else {
        setPromoError(response.error || 'Invalid promo code');
      }
    } catch (error) {
      setPromoError(error.message);
    } finally {
      setPromoLoading(false);
    }
  };

  return (
    <div style={styles.stepContent}>
      <h2 style={styles.stepTitle}>Review Your Cart</h2>

      {/* Cart Items */}
      <div style={styles.cartItems}>
        {cart.items.map(item => (
          <div key={item.cartItemId} style={styles.cartItem}>
            {item.image_url && (
              <img src={item.image_url} alt={item.item_name} style={styles.cartItemImage} />
            )}
            <div style={styles.cartItemInfo}>
              <h4 style={styles.cartItemName}>
                {item.item_name}
                {item.variant_name && <span style={styles.cartItemVariant}> - {item.variant_name}</span>}
              </h4>
              {item.toppings?.length > 0 && (
                <p style={styles.cartItemToppings}>
                  {item.toppings.map(t => t.name).join(', ')}
                </p>
              )}
              {item.special_instructions && (
                <p style={styles.cartItemInstructions}>"{item.special_instructions}"</p>
              )}
            </div>
            <div style={styles.cartItemActions}>
              <div style={styles.quantityControl}>
                <button
                  onClick={() => cart.updateQuantity(item.cartItemId, item.quantity - 1)}
                  style={styles.quantityBtn}
                >
                  <Minus size={16} />
                </button>
                <span style={styles.quantityValue}>{item.quantity}</span>
                <button
                  onClick={() => cart.updateQuantity(item.cartItemId, item.quantity + 1)}
                  style={styles.quantityBtn}
                >
                  <Plus size={16} />
                </button>
              </div>
              <span style={styles.cartItemPrice}>
                ${(item.unit_price * item.quantity).toFixed(2)}
              </span>
              <button
                onClick={() => cart.removeItem(item.cartItemId)}
                style={styles.removeBtn}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Promo Code */}
      <div style={styles.promoSection}>
        <div style={styles.promoInput}>
          <Tag size={18} style={styles.promoIcon} />
          <input
            type="text"
            placeholder="Promo code"
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
            style={styles.input}
            disabled={!!cart.promoCode}
          />
          {cart.promoCode ? (
            <button onClick={() => { cart.clearPromo(); setPromoInput(''); }} style={styles.promoClearBtn}>
              Remove
            </button>
          ) : (
            <button
              onClick={handleApplyPromo}
              disabled={promoLoading}
              style={styles.promoApplyBtn}
            >
              {promoLoading ? 'Applying...' : 'Apply'}
            </button>
          )}
        </div>
        {promoError && <p style={styles.promoError}>{promoError}</p>}
        {cart.promoCode && (
          <p style={styles.promoSuccess}>
            <Check size={16} /> Code "{cart.promoCode}" applied! Saving ${cart.promoDiscount.toFixed(2)}
          </p>
        )}
      </div>

      {/* Order Summary */}
      <OrderSummary cart={cart} />

      {/* Next Button */}
      <button onClick={onNext} style={styles.primaryBtn}>
        Continue to Delivery
        <ChevronRight size={20} />
      </button>
    </div>
  );
}

// ============================================
// STEP 2: DELIVERY/PICKUP
// ============================================

function DeliveryStep({ cart, onBack, onNext }) {
  const { addresses, loading, addAddress } = useAddresses();
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    street_address: '',
    apartment: '',
    city: '',
    state: '',
    zip_code: '',
    delivery_instructions: ''
  });

  const handleSaveAddress = async () => {
    if (!newAddress.street_address || !newAddress.city || !newAddress.state || !newAddress.zip_code) {
      alert('Please fill in all required fields');
      return;
    }

    await addAddress(newAddress);
    cart.setDeliveryAddress(newAddress);
    setShowAddressForm(false);
  };

  return (
    <div style={styles.stepContent}>
      <h2 style={styles.stepTitle}>How would you like to receive your order?</h2>

      {/* Order Type Toggle */}
      <div style={styles.orderTypeToggle}>
        <button
          onClick={() => cart.setOrderType('delivery')}
          style={{
            ...styles.orderTypeBtn,
            ...(cart.orderType === 'delivery' ? styles.orderTypeBtnActive : {})
          }}
        >
          <Truck size={24} />
          <span>Delivery</span>
          <small>$4.99 delivery fee</small>
        </button>
        <button
          onClick={() => cart.setOrderType('pickup')}
          style={{
            ...styles.orderTypeBtn,
            ...(cart.orderType === 'pickup' ? styles.orderTypeBtnActive : {})
          }}
        >
          <Store size={24} />
          <span>Pickup</span>
          <small>Ready in ~25 min</small>
        </button>
      </div>

      {/* Delivery Address Selection */}
      {cart.orderType === 'delivery' && (
        <div style={styles.addressSection}>
          <h3 style={styles.sectionSubtitle}>Select Delivery Address</h3>

          {loading ? (
            <div style={styles.loading}><Loader size={24} /> Loading addresses...</div>
          ) : (
            <>
              {addresses.map(addr => (
                <div
                  key={addr.id}
                  onClick={() => cart.setDeliveryAddress(addr)}
                  style={{
                    ...styles.addressCard,
                    ...(cart.deliveryAddress?.id === addr.id ? styles.addressCardSelected : {})
                  }}
                >
                  <div style={styles.addressContent}>
                    <span style={styles.addressLabel}>{addr.label || 'Address'}</span>
                    <p style={styles.addressText}>
                      {addr.street_address}
                      {addr.apartment && `, ${addr.apartment}`}
                    </p>
                    <p style={styles.addressCity}>
                      {addr.city}, {addr.state} {addr.zip_code}
                    </p>
                  </div>
                  {cart.deliveryAddress?.id === addr.id && (
                    <Check size={24} style={styles.addressCheck} />
                  )}
                </div>
              ))}

              {/* Add New Address */}
              {!showAddressForm ? (
                <button
                  onClick={() => setShowAddressForm(true)}
                  style={styles.addAddressBtn}
                >
                  <Plus size={20} />
                  Add New Address
                </button>
              ) : (
                <div style={styles.addressForm}>
                  <input
                    type="text"
                    placeholder="Street Address *"
                    value={newAddress.street_address}
                    onChange={(e) => setNewAddress({ ...newAddress, street_address: e.target.value })}
                    style={styles.formInput}
                  />
                  <input
                    type="text"
                    placeholder="Apt, Suite, Floor (optional)"
                    value={newAddress.apartment}
                    onChange={(e) => setNewAddress({ ...newAddress, apartment: e.target.value })}
                    style={styles.formInput}
                  />
                  <div style={styles.formRow}>
                    <input
                      type="text"
                      placeholder="City *"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      style={{ ...styles.formInput, flex: 2 }}
                    />
                    <input
                      type="text"
                      placeholder="State *"
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      style={{ ...styles.formInput, flex: 1 }}
                    />
                    <input
                      type="text"
                      placeholder="ZIP *"
                      value={newAddress.zip_code}
                      onChange={(e) => setNewAddress({ ...newAddress, zip_code: e.target.value })}
                      style={{ ...styles.formInput, flex: 1 }}
                    />
                  </div>
                  <textarea
                    placeholder="Delivery instructions (optional)"
                    value={newAddress.delivery_instructions}
                    onChange={(e) => setNewAddress({ ...newAddress, delivery_instructions: e.target.value })}
                    style={styles.formTextarea}
                  />
                  <div style={styles.formActions}>
                    <button onClick={() => setShowAddressForm(false)} style={styles.secondaryBtn}>
                      Cancel
                    </button>
                    <button onClick={handleSaveAddress} style={styles.primaryBtn}>
                      Save & Use
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Pickup Info */}
      {cart.orderType === 'pickup' && (
        <div style={styles.pickupInfo}>
          <Store size={32} style={{ color: '#dc2626' }} />
          <h3>Pickup Location</h3>
          <p>123 Pizza Street, Brooklyn, NY 11201</p>
          <p style={styles.pickupTime}>
            <Clock size={16} />
            Estimated ready in 20-25 minutes
          </p>
        </div>
      )}

      {/* Special Instructions */}
      <div style={styles.instructionsSection}>
        <h3 style={styles.sectionSubtitle}>Special Instructions</h3>
        <textarea
          placeholder="Any special requests for your order?"
          value={cart.specialInstructions}
          onChange={(e) => cart.setSpecialInstructions(e.target.value)}
          style={styles.formTextarea}
        />
      </div>

      {/* Navigation */}
      <div style={styles.stepNav}>
        <button onClick={onBack} style={styles.backBtn}>
          <ChevronLeft size={20} />
          Back to Cart
        </button>
        <button onClick={onNext} style={styles.primaryBtn}>
          Continue to Payment
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}

// ============================================
// STEP 3: PAYMENT
// ============================================

function PaymentStep({ cart, onBack, onSubmit, processing, error }) {
  const [tipOption, setTipOption] = useState('18');

  const tipOptions = [
    { value: '15', label: '15%' },
    { value: '18', label: '18%' },
    { value: '20', label: '20%' },
    { value: 'custom', label: 'Custom' }
  ];

  useEffect(() => {
    const tipPercent = parseFloat(tipOption) || 0;
    const tipAmount = (cart.subtotal - cart.promoDiscount) * (tipPercent / 100);
    cart.setTip(tipAmount);
  }, [tipOption, cart.subtotal, cart.promoDiscount]);

  return (
    <div style={styles.stepContent}>
      <h2 style={styles.stepTitle}>Payment</h2>

      {/* Order Summary */}
      <OrderSummary cart={cart} showTip />

      {/* Tip Selection */}
      {cart.orderType === 'delivery' && (
        <div style={styles.tipSection}>
          <h3 style={styles.sectionSubtitle}>Add a Tip</h3>
          <div style={styles.tipOptions}>
            {tipOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setTipOption(opt.value)}
                style={{
                  ...styles.tipBtn,
                  ...(tipOption === opt.value ? styles.tipBtnActive : {})
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Credit Card */}
      <div style={styles.cardSection}>
        <h3 style={styles.sectionSubtitle}>Card Details</h3>
        <div style={styles.cardElement}>
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#1f2937',
                  '::placeholder': { color: '#9ca3af' }
                }
              }
            }}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={styles.errorMessage}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Navigation */}
      <div style={styles.stepNav}>
        <button onClick={onBack} style={styles.backBtn} disabled={processing}>
          <ChevronLeft size={20} />
          Back
        </button>
        <button
          onClick={onSubmit}
          style={styles.payBtn}
          disabled={processing}
        >
          {processing ? (
            <>
              <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
              Processing...
            </>
          ) : (
            <>
              Pay ${cart.total.toFixed(2)}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================
// STEP 4: CONFIRMATION
// ============================================

function ConfirmationStep({ order, onTrackOrder, onNewOrder }) {
  return (
    <div style={styles.confirmationContent}>
      <div style={styles.confirmationIcon}>
        <Check size={48} />
      </div>
      <h2 style={styles.confirmationTitle}>Order Confirmed!</h2>
      <p style={styles.confirmationText}>
        Thank you for your order. Your order number is:
      </p>
      <p style={styles.orderNumber}>{order?.order_number}</p>

      <div style={styles.estimatedTime}>
        <Clock size={20} />
        <span>Estimated ready: {new Date(order?.estimated_ready_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>

      <div style={styles.confirmationActions}>
        <button onClick={onTrackOrder} style={styles.primaryBtn}>
          Track Order
        </button>
        <button onClick={onNewOrder} style={styles.secondaryBtn}>
          Order More
        </button>
      </div>
    </div>
  );
}

// ============================================
// ORDER SUMMARY COMPONENT
// ============================================

function OrderSummary({ cart, showTip = false }) {
  return (
    <div style={styles.orderSummary}>
      <div style={styles.summaryRow}>
        <span>Subtotal</span>
        <span>${cart.subtotal.toFixed(2)}</span>
      </div>
      {cart.promoDiscount > 0 && (
        <div style={{ ...styles.summaryRow, color: '#22c55e' }}>
          <span>Discount ({cart.promoCode})</span>
          <span>-${cart.promoDiscount.toFixed(2)}</span>
        </div>
      )}
      <div style={styles.summaryRow}>
        <span>Tax</span>
        <span>${cart.tax.toFixed(2)}</span>
      </div>
      {cart.orderType === 'delivery' && (
        <div style={styles.summaryRow}>
          <span>Delivery Fee</span>
          <span>${cart.deliveryFee.toFixed(2)}</span>
        </div>
      )}
      {showTip && cart.tip > 0 && (
        <div style={styles.summaryRow}>
          <span>Tip</span>
          <span>${cart.tip.toFixed(2)}</span>
        </div>
      )}
      <div style={styles.summaryTotal}>
        <span>Total</span>
        <span>${cart.total.toFixed(2)}</span>
      </div>
    </div>
  );
}

// ============================================
// STYLES
// ============================================

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '24px 16px',
  },

  // Progress Bar
  progressBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '32px',
    padding: '0 16px',
  },
  stepItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  stepItemActive: {},
  stepIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#e5e7eb',
    color: '#9ca3af',
  },
  stepIconActive: {
    background: '#dc2626',
    color: 'white',
  },
  stepIconComplete: {
    background: '#22c55e',
  },
  stepLabel: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '500',
  },
  stepConnector: {
    width: '60px',
    height: '2px',
    background: '#e5e7eb',
    margin: '0 8px 20px',
  },
  stepConnectorActive: {
    background: '#22c55e',
  },

  // Content
  content: {
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  stepContent: {
    padding: '24px',
  },
  stepTitle: {
    fontSize: '24px',
    fontWeight: '700',
    marginBottom: '24px',
    color: '#1f2937',
  },

  // Cart Items
  cartItems: {
    marginBottom: '24px',
  },
  cartItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 0',
    borderBottom: '1px solid #f3f4f6',
  },
  cartItemImage: {
    width: '80px',
    height: '80px',
    borderRadius: '8px',
    objectFit: 'cover',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: '16px',
    fontWeight: '600',
    margin: 0,
  },
  cartItemVariant: {
    fontWeight: '400',
    color: '#6b7280',
  },
  cartItemToppings: {
    fontSize: '13px',
    color: '#6b7280',
    margin: '4px 0 0',
  },
  cartItemInstructions: {
    fontSize: '12px',
    color: '#9ca3af',
    fontStyle: 'italic',
    margin: '4px 0 0',
  },
  cartItemActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  cartItemPrice: {
    fontWeight: '600',
    fontSize: '16px',
    minWidth: '70px',
    textAlign: 'right',
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
  },

  // Quantity Control
  quantityControl: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
  },
  quantityBtn: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  quantityValue: {
    minWidth: '30px',
    textAlign: 'center',
    fontWeight: '600',
  },

  // Promo Section
  promoSection: {
    marginBottom: '24px',
    padding: '16px',
    background: '#f9fafb',
    borderRadius: '12px',
  },
  promoInput: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  promoIcon: {
    color: '#6b7280',
  },
  input: {
    flex: 1,
    padding: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
  },
  promoApplyBtn: {
    padding: '12px 20px',
    background: '#1f2937',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  promoClearBtn: {
    padding: '12px 20px',
    background: '#f3f4f6',
    color: '#6b7280',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  promoError: {
    color: '#dc2626',
    fontSize: '13px',
    marginTop: '8px',
  },
  promoSuccess: {
    color: '#22c55e',
    fontSize: '13px',
    marginTop: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },

  // Order Summary
  orderSummary: {
    padding: '20px',
    background: '#f9fafb',
    borderRadius: '12px',
    marginBottom: '24px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '12px',
    fontSize: '14px',
    color: '#4b5563',
  },
  summaryTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: '12px',
    borderTop: '1px solid #e5e7eb',
    fontSize: '18px',
    fontWeight: '700',
    color: '#1f2937',
  },

  // Order Type
  orderTypeToggle: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '24px',
  },
  orderTypeBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '20px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    background: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  orderTypeBtnActive: {
    borderColor: '#dc2626',
    background: '#fef2f2',
  },

  // Address
  addressSection: {
    marginBottom: '24px',
  },
  sectionSubtitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '12px',
  },
  addressCard: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    marginBottom: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  addressCardSelected: {
    borderColor: '#dc2626',
    background: '#fef2f2',
  },
  addressContent: {
    flex: 1,
  },
  addressLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#dc2626',
    textTransform: 'uppercase',
  },
  addressText: {
    margin: '4px 0 0',
    fontWeight: '500',
  },
  addressCity: {
    margin: '2px 0 0',
    fontSize: '14px',
    color: '#6b7280',
  },
  addressCheck: {
    color: '#dc2626',
  },
  addAddressBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '14px',
    border: '2px dashed #e5e7eb',
    borderRadius: '12px',
    background: 'none',
    color: '#6b7280',
    cursor: 'pointer',
  },

  // Address Form
  addressForm: {
    padding: '20px',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    marginTop: '12px',
  },
  formInput: {
    width: '100%',
    padding: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    marginBottom: '12px',
    fontSize: '14px',
  },
  formRow: {
    display: 'flex',
    gap: '12px',
  },
  formTextarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    marginBottom: '12px',
    fontSize: '14px',
    resize: 'none',
    minHeight: '80px',
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },

  // Pickup Info
  pickupInfo: {
    textAlign: 'center',
    padding: '40px 20px',
    background: '#f9fafb',
    borderRadius: '12px',
    marginBottom: '24px',
  },
  pickupTime: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '12px',
    color: '#6b7280',
  },

  // Instructions
  instructionsSection: {
    marginBottom: '24px',
  },

  // Tip
  tipSection: {
    marginBottom: '24px',
  },
  tipOptions: {
    display: 'flex',
    gap: '8px',
  },
  tipBtn: {
    flex: 1,
    padding: '12px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    background: 'white',
    fontWeight: '600',
    cursor: 'pointer',
  },
  tipBtnActive: {
    borderColor: '#dc2626',
    background: '#fef2f2',
    color: '#dc2626',
  },

  // Card Element
  cardSection: {
    marginBottom: '24px',
  },
  cardElement: {
    padding: '16px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
  },

  // Error
  errorMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    background: '#fef2f2',
    color: '#dc2626',
    borderRadius: '8px',
    marginBottom: '24px',
  },

  // Navigation
  stepNav: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    paddingTop: '16px',
    borderTop: '1px solid #f3f4f6',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 20px',
    background: '#f3f4f6',
    color: '#4b5563',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  primaryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 24px',
    background: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  secondaryBtn: {
    padding: '14px 24px',
    background: '#f3f4f6',
    color: '#4b5563',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  payBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 32px',
    background: '#22c55e',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: '700',
    cursor: 'pointer',
  },

  // Confirmation
  confirmationContent: {
    textAlign: 'center',
    padding: '60px 24px',
  },
  confirmationIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: '#22c55e',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
  },
  confirmationTitle: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '8px',
  },
  confirmationText: {
    color: '#6b7280',
    marginBottom: '8px',
  },
  orderNumber: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: '24px',
  },
  estimatedTime: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 24px',
    background: '#f9fafb',
    borderRadius: '8px',
    marginBottom: '32px',
  },
  confirmationActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },

  // Loading
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '40px',
    color: '#6b7280',
  },
};
