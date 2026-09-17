import React from "react";
import { Button, Typography } from "@mui/material";
import { useNavigate } from "react-router";
import { useCart } from "../context/cartContext";
import { useEvents } from "../hooks/useEvents";

export default function MyCart() {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, clearCart } = useCart();
  const { events, loading: eventsLoading } = useEvents();
  const loading = cartItems.length > 0 && eventsLoading;

  const cartData = cartItems.map(item => {
    const event = events.find(e => e.id === item.eventId);
    const ticketType = event?.ticketTypes?.find(t => t.id === item.ticketTypeId);

    return {
      ...item,
      event,
      ticketType,
      // The event or the ticket type is gone, or it was deactivated.
      // Cart entries live in localStorage forever, so this is reachable.
      unavailable: !ticketType || ticketType.isActive === false
    };
  });

  const unavailableItems = cartData.filter(item => item.unavailable);

  const totalAmount = cartData.reduce((sum, item) => {
    if (item.unavailable) return sum;
    return sum + Number(item.ticketType?.price ?? 0) * item.count;
  }, 0);

  const handleCheckout = () => {
    const cartItemsArray = cartItems.map(item => ({
      ticketTypeId: item.ticketTypeId,
      count: item.count
    }));

    if (cartItemsArray.length === 0) {
      alert("Sepetiniz boş");
      return;
    }

    // Sending these would fail at the API with "ticket type cant be found".
    // Dropping them silently would change the order behind the user's back, so
    // ask instead.
    if (unavailableItems.length > 0) {
      alert("Sepetinizde artık satışta olmayan biletler var. Devam etmek için onları kaldırın.");
      return;
    }

    const eventId = cartItems[0].eventId;
    navigate("/checkout", { state: { cartItems: cartItemsArray, eventId } });
  };

  if (loading) {
    return (
      <div className="page-container">
        <Typography>Loading...</Typography>
      </div>
    );
  }

  if (cartData.length === 0) {
    return (
      <div className="centered-panel">
        <div className="centered-panel__card">
          <Typography variant="h5" className="cart-page__empty">Your Cart is Empty</Typography>
          <Button variant="contained" onClick={() => navigate("/events")}>
            Back to events
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Typography variant="h3" className="page-header__title">
          Sepetim
        </Typography>
      </div>

      <div className="cart-page__grid">
        <div className="cart-page__items">
          {cartData.map((item) => (
            <div
              className={`ticket-line${item.unavailable ? " ticket-line--unavailable" : ""}`}
              key={`${item.eventId}-${item.ticketTypeId}`}
            >
              <div className="ticket-line__row">
                <div>
                  <Typography className="ticket-line__title">
                    {item.event?.title || "Etkinlik bulunamadı"}
                  </Typography>
                  {item.unavailable ? (
                    <Typography variant="body2" color="error" className="ticket-line__subtitle">
                      Bu bilet artık satışta değil.
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary" className="ticket-line__subtitle">
                      {item.ticketType.name} - {item.ticketType.price} ₺ x {item.count}
                    </Typography>
                  )}
                </div>
                <div>
                  {!item.unavailable && (
                    <Typography className="ticket-line__price">
                      {(Number(item.ticketType.price) * item.count).toFixed(2)} ₺
                    </Typography>
                  )}
                  <Button size="small" color="error" onClick={() => removeFromCart(item.ticketTypeId, item.eventId)}>
                    Sil
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-page__summary">
          <Typography variant="h6" className="section__title">
            Özet
          </Typography>

          <div className="cart-page__summary-row">
            <Typography>Toplam:</Typography>
            <Typography fontWeight="bold">{totalAmount.toFixed(2)} ₺</Typography>
          </div>

          {unavailableItems.length > 0 && (
            <Typography variant="body2" className="field-error">
              Satışta olmayan {unavailableItems.length} bilet var. Ödemeye geçmek için
              onları sepetten kaldırın.
            </Typography>
          )}

          <Button
            variant="contained"
            fullWidth
            onClick={handleCheckout}
            disabled={unavailableItems.length > 0}
          >
            Ödemeye Geç
          </Button>
          <Button variant="outlined" fullWidth onClick={() => navigate("/events")}>
            Etkinliklere Dön
          </Button>
        </div>
      </div>
    </div>
  );
}
