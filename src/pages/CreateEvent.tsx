import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin, Users, Loader2, DollarSign, Tag } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { EventsService } from "@/services/events";
import { useAuth } from "@/hooks/use-auth";
import { useArchaeologist } from "@/hooks/use-archaeologist";
import { Timestamp } from "firebase/firestore";

const CreateEvent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isArchaeologist, loading: archaeologistLoading, canCreate } = useArchaeologist();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    restrictions: "",
    date: "",
    startTime: "",
    endTime: "",
    locationName: "",
    locationAddress: "",
    category: "",
    maxAttendees: "",
    ticketPrice: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.title || !formData.description || !formData.date || !formData.startTime ||
        !formData.endTime || !formData.locationName || !formData.locationAddress || !formData.category) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !user) {
      return;
    }

    setLoading(true);

    try {
      const eventDate = new Date(formData.date);

      const eventData = {
        title: formData.title,
        description: formData.description,
        restrictions: formData.restrictions || "",
        date: Timestamp.fromDate(eventDate),
        startTime: formData.startTime,
        endTime: formData.endTime,
        locationName: formData.locationName,
        locationAddress: formData.locationAddress,
        category: formData.category,
        maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : undefined,
        ticketPrice: formData.ticketPrice ? parseFloat(formData.ticketPrice) : undefined,
        createdBy: user.uid
      };

      await EventsService.createEvent(eventData);

      toast({
        title: "Success!",
        description: "Event has been successfully created",
      });

      setTimeout(() => {
        navigate("/events");
      }, 1500);

    } catch (error) {
      console.error("Error creating event:", error);
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto">
        <header className="bg-card p-4 border-b border-border sticky top-0 z-10">
          <PageHeader />
        </header>

        {/* Auth & Access Check */}
        {!canCreate && (
          <div className="p-4">
            <Card>
              <div className="p-6 text-center">
                <p className="text-muted-foreground mb-4">
                  {!user ? 'Please sign in as an archaeologist to create events.' :
                   !isArchaeologist ? 'Only verified archaeologists can create events.' :
                   'Loading...'}
                </p>
                {!user && (
                  <Button
                    onClick={() => navigate('/authentication/sign-in')}
                    variant="outline"
                  >
                    Sign In as Archaeologist
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Form - Only show if user can create */}
        {canCreate && (
          <div className="p-4 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Event Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-foreground">Event Title *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., Public Lab Night at the Wall Center"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="border-border"
                />
              </div>

              {/* Event Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-foreground">Event Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Detailed description of the event..."
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  className="min-h-32 border-border"
                />
              </div>

              {/* Restrictions */}
              <div className="space-y-2">
                <Label htmlFor="restrictions" className="text-foreground">Event Restrictions</Label>
                <Textarea
                  id="restrictions"
                  name="restrictions"
                  placeholder="e.g., Limited to 8 persons. Registration and $5 fee required..."
                  value={formData.restrictions}
                  onChange={handleInputChange}
                  className="min-h-24 border-border"
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-foreground">Event Date *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                      className="pl-10 border-border"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime" className="text-foreground">Start Time *</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="startTime"
                        name="startTime"
                        type="time"
                        value={formData.startTime}
                        onChange={handleInputChange}
                        required
                        className="pl-10 border-border"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endTime" className="text-foreground">End Time *</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="endTime"
                        name="endTime"
                        type="time"
                        value={formData.endTime}
                        onChange={handleInputChange}
                        required
                        className="pl-10 border-border"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="locationName" className="text-foreground">Location Name *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="locationName"
                    name="locationName"
                    placeholder="e.g., The Wall Center"
                    value={formData.locationName}
                    onChange={handleInputChange}
                    required
                    className="pl-10 border-border"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="locationAddress" className="text-foreground">Full Address *</Label>
                <Input
                  id="locationAddress"
                  name="locationAddress"
                  placeholder="e.g., 220 New Street, Morganton, NC, 28655"
                  value={formData.locationAddress}
                  onChange={handleInputChange}
                  required
                  className="border-border"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-foreground">Event Category *</Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="category"
                    name="category"
                    placeholder="e.g., Instructional Lab Volunteer Opportunity"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="pl-10 border-border"
                  />
                </div>
              </div>

              {/* Optional Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxAttendees" className="text-foreground">Max Attendees</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="maxAttendees"
                      name="maxAttendees"
                      type="number"
                      placeholder="e.g., 8"
                      value={formData.maxAttendees}
                      onChange={handleInputChange}
                      className="pl-10 border-border"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ticketPrice" className="text-foreground">Ticket Price ($)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="ticketPrice"
                      name="ticketPrice"
                      type="number"
                      step="0.01"
                      placeholder="e.g., 5.00"
                      value={formData.ticketPrice}
                      onChange={handleInputChange}
                      className="pl-10 border-border"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Event"
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateEvent;
