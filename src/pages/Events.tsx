import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin, Folder, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventsService, Event } from "@/services/events";
import { Timestamp } from "firebase/firestore";

const Events = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const allEvents = await EventsService.getAllEvents();
        setEvents(allEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const formatEventDate = (date: Timestamp) => {
    const d = date.toDate();
    return d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
  };

  const getMonthDay = (date: Timestamp) => {
    const d = date.toDate();
    return {
      month: d.toLocaleDateString("en-US", { month: "short" }),
      day: d.getDate().toString()
    };
  };

  const formatTime = (startTime: string, endTime: string) => {
    return `${startTime} - ${endTime}`;
  };

  const getCurrentMonthYear = () => {
    const now = new Date();
    return now.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto">
        <header className="bg-card p-4 border-b border-border sticky top-0 z-10">
          <PageHeader />
        </header>

        <div className="p-4 space-y-6">
          {/* Month Header */}
          <div>
            <h1 className="text-4xl font-bold text-foreground">{getCurrentMonthYear()}</h1>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : events.length === 0 ? (
            <Card className="p-6 border-border text-center">
              <p className="text-muted-foreground">No events available</p>
            </Card>
          ) : (
            /* Events List */
            <div className="space-y-4">
              {events.map((event) => {
                const { month, day } = getMonthDay(event.date);
                return (
                <div key={event.id} className="flex gap-4">
                  {/* Calendar Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 border-4 border-muted rounded-xl flex flex-col items-center justify-center bg-background">
                      <div className="flex gap-2 mb-1">
                        <div className="w-2 h-6 bg-muted rounded-full"></div>
                        <div className="w-2 h-6 bg-muted rounded-full"></div>
                      </div>
                      <div className="text-5xl font-bold text-muted-foreground leading-none mb-1">
                        {day}
                      </div>
                      <div className="text-lg text-muted-foreground">
                        {month}
                      </div>
                    </div>
                  </div>

                  {/* Event Details Card */}
                  <Card className="flex-1 border-l-4 border-l-primary">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xl text-primary">
                        {event.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{formatEventDate(event.date)}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{formatTime(event.startTime, event.endTime)}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span className="underline">{event.locationName}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Folder className="w-4 h-4" />
                        <span className="underline">{event.category}</span>
                      </div>

                      <p className="text-sm text-muted-foreground pt-2 line-clamp-2">
                        {event.description}
                      </p>

                      <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={() => navigate(`/event/${event.id}`)}
                      >
                        MORE INFO
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
            </div>
          )}
        </div>

        <BottomNav />
      </div>
    </div>
  );
};

export default Events;
