import React, { useEffect, useState } from "react";
import { Button, Chip, TextField, Typography } from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { useNavigate, useParams } from "react-router";
import { useCart } from "../context/cartContext";
import { getEvent } from "../api/events";
import { checkout } from "../api/payments";
import { useAuth } from "../authContext/authcontext";
import { v4 as uuidv4 } from "uuid";

const getStatusColor = (status) => {
  switch (status) {
    case "PUBLISHED": return "success";
    case "CANCELLED": return "error";
    case "COMPLETED": return "info";
    case "ARCHIVED": return "warning";
    default: return "default";
  }
};

export default function EventDetail() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [imdempotencyK, setIdempotencyKey] = useState(uuidv4());
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState({});
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const { addToCart } = useCart();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await getEvent(eventId);
        setEvent(response.data.event);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch event:", error);
        alert("Failed to load event details");
        navigate(-1);
      }
    };

    fetchEvent();
  }, [eventId, navigate]);

  if (loading) {
    return (
      <div className="page-container">
        <Typography>Loading...</Typography>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="page-container">
        <Typography>Event not found</Typography>
      </div>
    );
  }

  // Deactivating a ticket type is what the API tells a manager to do when a
  // delete is refused because orders reference it, so the buyer view has to
  // honour the flag or "deactivate" means nothing.
  const availableTicketTypes = (event.ticketTypes || []).filter(
    (ticketType) => ticketType.isActive !== false
  );

  const handleAddToCart = () => {
    Object.entries(quantities).forEach(([ticketTypeId, count]) => {
      if (count > 0) {
        addToCart({
          eventId: event.id,
          ticketTypeId,
          count,
          price: event.ticketTypes.find((t) => t.id === ticketTypeId)?.price,
        });
      }
    });
    alert("Added to cart!");
  };

  const handleCheckout = async () => {
    const cartItems = Object.entries(quantities)
      .filter(([, count]) => count > 0)
      .map(([ticketTypeId, count]) => ({
        ticketTypeId,
        count: parseInt(count, 10),
      }));

    if (cartItems.length === 0) {
      alert("Please select at least one ticket");
      return;
    }

    setCheckoutLoading(true);
    try {
      const response = await checkout(
        { eventId: event.id, cartItems },
        { headers: { "Idempotency-Key": `${imdempotencyK}-${user.userId}` } }
      );

      const { status, clientSecret, orderId } = response.data;

      setIdempotencyKey(uuidv4());
      if (status === "SUCCESS") {
        navigate("/payment-success", { state: { orderId } });
        return;
      }

      if (status === "PROCESSING") {
        alert("Your payment is being reviewed by the bank. You will be notified by email once the review is complete.");
        return;
      }

      navigate("/checkout", { state: { clientSecret, orderId } });
    } catch (err) {
      console.error("Checkout error:", err);
      alert(err.response?.data?.error || "Payment could not be initiated. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="page-container event-detail">
      <div className="event-detail__back">
        <Button variant="text" size="small" onClick={() => navigate(-1)}>
          ← Back
        </Button>
      </div>

      <div className="event-detail__card">
        <img
          className="event-detail__media"
          src={event.coverImageUrl || "https://placehold.co/800x400/e5e7eb/6b7280?text=Event"}
          alt={event.title}
        />

        <div className="event-detail__body">
          <div className="event-detail__head">
            <Typography variant="h4">{event.title}</Typography>
            <Chip label={event.status} size="small" color={getStatusColor(event.status)} />
          </div>

          <Typography variant="body1" color="text.secondary" className="event-detail__description">
            {event.description}
          </Typography>

          <div className="event-detail__meta">
            <span className="event-detail__meta-row">
              <CalendarMonthIcon fontSize="small" />
              <Typography variant="body2">
                {new Date(event.startDate).toLocaleString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                - {new Date(event.endDate).toLocaleString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </Typography>
            </span>

            <span className="event-detail__meta-row">
              <LocationOnIcon fontSize="small" />
              <Typography variant="body2">{event.address}</Typography>
            </span>
          </div>

          <Typography variant="body2" fontWeight="600">
            Capacity: {event.capacity} people
          </Typography>

          <div className="section">
            <Typography variant="h5" className="event-detail__section-title">
              Ticket Types
            </Typography>

            {availableTicketTypes.length === 0 && (
              <Typography color="text.secondary">
                There are currently no tickets available for this event.
              </Typography>
            )}

            <div className="event-detail__ticket-grid">
              {availableTicketTypes.map((ticketType) => (
                <div className="ticket-type-card" key={ticketType.id}>
                  <Typography className="ticket-type-card__name">{ticketType.name}</Typography>
                  <Typography className="ticket-type-card__category">
                    Category: {ticketType.category}
                  </Typography>
                  <Typography className="ticket-type-card__price">{ticketType.price} ₺</Typography>
                  <Typography variant="caption" className="ticket-type-card__meta">
                    {ticketType.totalCount - ticketType.soldCount} tickets available
                  </Typography>
                  <TextField
                    type="number"
                    size="small"
                    label="Quantity"
                    fullWidth
                    value={quantities[ticketType.id] || 0}
                    onChange={(e) =>
                      setQuantities((prev) => ({
                        ...prev,
                        [ticketType.id]: Math.max(0, parseInt(e.target.value) || 0),
                      }))
                    }
                    slotProps={{ htmlInput: { min: 0, max: ticketType.totalCount } }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="event-detail__actions">
            <Button variant="outlined" size="large" onClick={handleAddToCart}>
              Add to Cart
            </Button>
            <Button variant="contained" size="large" disabled={checkoutLoading} onClick={handleCheckout}>
              {checkoutLoading ? "Preparing..." : "Go to Payment Page"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
