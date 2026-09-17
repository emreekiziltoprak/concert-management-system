import { Chip, IconButton, Button } from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router";
import { deleteEvent } from "../api/events";

const getStatusColor = (status) => {
  switch (status) {
    case "PUBLISHED":
      return "success";
    case "CANCELLED":
      return "error";
    case "COMPLETED":
      return "info";
    case "ARCHIVED":
      return "warning";
    default:
      return "default";
  }
};

export default function EventCard({ event, onEventUpdated, onEditClick }) {
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await deleteEvent(event.id);
      onEventUpdated?.();
    } catch (error) {
      console.error(error);
      alert("Failed to delete event");
    }
  };

  const handleEditClick = () => onEditClick?.(event);
  const handleDetailClick = () => navigate(`/event/${event.id}`);

  return (
    <article className="event-card">
      <div className="event-card__media">
        <img
          src={event.coverImageUrl || "https://placehold.co/256x176/e5e7eb/6b7280?text=Event"}
          alt={event.title}
        />
      </div>

      <div className="event-card__body">
        <span className="event-card__title">{event.title}</span>

        <div className="event-card__meta">
          <span className="event-card__meta-row">
            <LocationOnIcon />
            {event.address}
          </span>
          <span className="event-card__meta-row">
            <CalendarMonthIcon />
            {new Date(event.startDate).toLocaleString("tr-TR", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span className="event-card__meta-row">
            <Chip label={event.status} size="small" color={getStatusColor(event.status)} className="event-card__status" />
          </span>
        </div>

        <div className="event-card__actions">
          <IconButton size="small" className="icon-action" onClick={handleEditClick} aria-label="Edit event">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" className="icon-action icon-action--danger" onClick={handleDelete} aria-label="Delete event">
            <DeleteIcon fontSize="small" />
          </IconButton>
          <Button size="small" variant="contained" onClick={handleDetailClick}>
            Detail
          </Button>
        </div>
      </div>
    </article>
  );
}
