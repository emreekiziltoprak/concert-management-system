import React, { useEffect, useState } from "react";
import { Button, Typography, CircularProgress, Alert, Divider } from "@mui/material";
import { getProfile } from "../api/users";
import { QRCodeSVG } from 'qrcode.react';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await getProfile();
        setProfile(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setError("Failed to load profile. Please try again later.");
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="centered-panel">
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <div className="centered-panel">
        <Alert severity="error">{error}</Alert>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="centered-panel">
        <Alert severity="warning">No profile data found.</Alert>
      </div>
    );
  }

  const { fullName, email, avatarUrl, bio, phoneNumber, role, orders = [] } = profile;

  // Sort orders by creation date (newest first)
  const sortedOrders = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="page-container profile-page">
      <div className="profile-page__head">
        {avatarUrl ? (
          <img className="profile-page__avatar" src={avatarUrl} alt="Avatar" />
        ) : (
          <div className="profile-page__avatar-fallback">{fullName?.charAt(0) || "?"}</div>
        )}
        <div>
          <Typography variant="h4">{fullName}</Typography>
          <Typography variant="body2" color="text.secondary">
            {email}
          </Typography>
          {bio && <Typography variant="body1">{bio}</Typography>}
          {phoneNumber && <Typography variant="body2">{phoneNumber}</Typography>}
          <Typography variant="body2">Role: {role}</Typography>
        </div>
      </div>

      <div className="section">
        <Typography variant="h5" className="section__title">
          My Orders
        </Typography>

        {sortedOrders.length === 0 ? (
          <div className="profile-page__empty">
            <Typography variant="body1">You haven't purchased any tickets yet.</Typography>
          </div>
        ) : (
          <div className="profile-page__orders">
            {sortedOrders.map((order) => {
              const event = order.event;
              const orderDate = new Date(order.createdAt).toLocaleString();

              return (
                <div className="profile-page__order-card" key={order.id}>
                  {event && (
                    <div className="profile-page__order-head">
                      <Typography variant="h6">{event.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(event.startDate).toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Order Date: {orderDate}
                      </Typography>
                    </div>
                  )}

                  <Divider className="divider-spacing" />

                  {order.orderItems && order.orderItems.length > 0 ? (
                    <div className="profile-page__tickets">
                      {order.orderItems.map((item) => {
                        const ticketType = item.ticketType;
                        const tickets = item.tickets || [];

                        return tickets.map((ticket) => {
                          const isUsed = ticket.isUsed ?? false;
                          return (
                            <div
                              className={`profile-page__ticket${isUsed ? " profile-page__ticket--used" : ""}`}
                              key={ticket.id}
                            >
                              {isUsed && <span className="profile-page__ticket-badge">Used</span>}
                              <Typography variant="body2" color="text.secondary">
                                {ticketType?.name || "Standard"}
                              </Typography>
                              <QRCodeSVG value={ticket.id} size={100} level="H" includeMargin={false} />
                              <Typography variant="caption">Ticket ID: {ticket.id}</Typography>
                            </div>
                          );
                        });
                      })}
                    </div>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No tickets in this order.
                    </Typography>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="profile-page__empty">
        <Button variant="outlined" color="primary" onClick={() => window.location.href = "/events"}>
          Browse Events
        </Button>
      </div>
    </div>
  );
};

export default Profile;
