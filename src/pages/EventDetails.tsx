import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, MapPin, Ticket, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EventsService, Event } from "@/services/events";
import { useToast } from "@/components/ui/use-toast";

const EventDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) {
        toast({
          title: "Error",
          description: "Event ID not found",
          variant: "destructive"
        });
        navigate("/events");
        return;
      }

      try {
        setLoading(true);
        const eventData = await EventsService.getEventById(id);

        if (!eventData) {
          toast({
            title: "Error",
            description: "Event not found",
            variant: "destructive"
          });
          navigate("/events");
          return;
        }

        setEvent(eventData);
      } catch (error) {
        console.error("Error loading event:", error);
        toast({
          title: "Error",
          description: "Failed to load event",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, navigate, toast]);

  const formatEventDate = (date: any) => {
    const d = date.toDate();
    return d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
  };

  const formatFullDate = (date: any) => {
    const d = date.toDate();
    return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  };

  const formatTime = (time: string) => {
    // Convert 24h to 12h format
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'pm' : 'am';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto">
        <header className="bg-card p-4 border-b border-border sticky top-0 z-10">
          <div className="flex items-center gap-3 mb-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="hover:bg-muted"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <PageHeader />
          </div>
        </header>

        <div className="p-4 space-y-6">
          {/* Event Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-6">
              {event.title}
            </h1>

            <div className="grid grid-cols-2 gap-6">
              {/* WHEN Section */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">WHEN</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <span className="text-base text-foreground">{formatEventDate(event.date)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <span className="text-base text-foreground">
                      {formatTime(event.startTime)} - {formatTime(event.endTime)}
                    </span>
                  </div>
                </div>
              </div>

              {/* WHERE Section */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">WHERE</h2>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-base text-foreground underline decoration-dotted mb-1">
                      {event.locationName}
                    </p>
                    <p className="text-base text-foreground">
                      {event.locationAddress}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border"></div>

          {/* Event Description */}
          <div className="space-y-4">
            <p className="text-base text-foreground leading-relaxed">
              {event.description}
            </p>

            {event.restrictions && (
              <p className="text-base text-foreground leading-relaxed">
                {event.restrictions}
              </p>
            )}
          </div>

          {/* Lab Night Details Section */}
          <Card className="border-border">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold text-center text-foreground mb-6">
                Lab Night Details
              </h2>

              <div className="space-y-6">
                {/* Date */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Date:</h3>
                  <ul className="list-disc list-inside">
                    <li className="text-base text-foreground font-semibold">
                      {formatFullDate(event.date)}
                    </li>
                  </ul>
                </div>

                {/* Time */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Time:</h3>
                  <p className="text-base text-foreground font-semibold">
                    from {formatTime(event.startTime)} to {formatTime(event.endTime)}
                  </p>
                </div>

                {/* Location */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Location:</h3>
                  <p className="text-base text-foreground font-bold mb-1">
                    {event.locationName}
                  </p>
                  <p className="text-base text-foreground font-bold">
                    {event.locationAddress}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate(-1)}
            >
              Back to Events
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={() => setShowTicketDialog(true)}
            >
              <Ticket className="w-4 h-4 mr-2" />
              Buy Tickets
            </Button>
          </div>
        </div>

        {/* Buy Tickets Dialog */}
        <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">Purchase Event Tickets</DialogTitle>
              <DialogDescription className="text-base pt-4">
                You will be redirected to the event organizer's secure payment site to complete your ticket purchase.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                By proceeding, you will be taken to an external payment platform managed by the event organizer. Please ensure you have your payment information ready.
              </p>
            </div>
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowTicketDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // In production, this would redirect to the organizer's payment site
                  console.log("Redirecting to organizer's payment site...");
                  setShowTicketDialog(false);
                  // window.location.href = "https://organizer-payment-site.com";
                }}
              >
                Continue to Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <BottomNav />
      </div>
    </div>
  );
};

export default EventDetails;
