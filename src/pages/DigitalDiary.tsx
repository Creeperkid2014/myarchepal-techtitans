import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Calendar, Clock, Image as ImageIcon, Mic, MicOff, Plus, Trash2, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { AccountButton } from "@/components/AccountButton";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DiaryEntry {
  id?: string;
  userId: string;
  title: string;
  content: string;
  imageUrl?: string;
  createdAt: Timestamp;
  date: string;
  time: string;
}

const DigitalDiary = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingEntries, setFetchingEntries] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });

  // Fetch diary entries
  useEffect(() => {
    const fetchEntries = async () => {
      if (!user) {
        setFetchingEntries(false);
        return;
      }

      try {
        setFetchingEntries(true);
        const q = query(
          collection(db, "DigitalDiary"),
          where("userId", "==", user.uid)
        );

        const querySnapshot = await getDocs(q);
        const entriesData: DiaryEntry[] = [];

        querySnapshot.forEach((doc) => {
          entriesData.push({
            id: doc.id,
            ...doc.data()
          } as DiaryEntry);
        });

        // Sort by createdAt on client side (newest first)
        entriesData.sort((a, b) => {
          const timeA = a.createdAt?.toMillis() || 0;
          const timeB = b.createdAt?.toMillis() || 0;
          return timeB - timeA;
        });

        setEntries(entriesData);
      } catch (error) {
        console.error("Error fetching diary entries:", error);
        toast({
          title: "Error",
          description: "Failed to load diary entries",
          variant: "destructive"
        });
      } finally {
        setFetchingEntries(false);
      }
    };

    fetchEntries();
  }, [user, toast]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'en-US';

        recognitionInstance.onresult = (event: any) => {
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            }
          }

          if (finalTranscript) {
            setFormData(prev => ({
              ...prev,
              content: prev.content + finalTranscript
            }));
          }
        };

        recognitionInstance.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          toast({
            title: "Speech Recognition Error",
            description: "Unable to recognize speech. Please try again.",
            variant: "destructive"
          });
        };

        recognitionInstance.onend = () => {
          setIsRecording(false);
        };

        setRecognition(recognitionInstance);
      }
    }
  }, [toast]);

  const toggleRecording = () => {
    if (!recognition) {
      toast({
        title: "Speech Recognition Not Available",
        description: "Your browser doesn't support speech recognition. Please use Chrome, Edge, or Safari.",
        variant: "destructive"
      });
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      try {
        recognition.start();
        setIsRecording(true);
        toast({
          title: "Recording Started",
          description: "Speak now to add to your diary entry...",
        });
      } catch (error) {
        console.error('Error starting recognition:', error);
        toast({
          title: "Error",
          description: "Failed to start recording. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive"
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive"
        });
        return;
      }

      setSelectedImage(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be signed in to create diary entries",
        variant: "destructive"
      });
      return;
    }

    if (!formData.title && !formData.content) {
      toast({
        title: "Validation Error",
        description: "Please add a title or content",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const now = new Date();
      const entryData: Omit<DiaryEntry, "id"> = {
        userId: user.uid,
        title: formData.title || "Untitled Entry",
        content: formData.content,
        createdAt: Timestamp.fromDate(now),
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
      };

      const docRef = await addDoc(collection(db, "DigitalDiary"), entryData);

      // Upload image if selected
      if (selectedImage && docRef.id) {
        try {
          const imageRef = ref(storage, `diaryImages/${user.uid}/${docRef.id}/${selectedImage.name}`);
          await uploadBytes(imageRef, selectedImage);
          const imageUrl = await getDownloadURL(imageRef);

          // Update the entry with image URL (we'll need to update the document)
          await addDoc(collection(db, "DigitalDiary"), {
            ...entryData,
            imageUrl
          });

          // Delete the old entry without image
          await deleteDoc(doc(db, "DigitalDiary", docRef.id));
        } catch (imageError) {
          console.error("Error uploading image:", imageError);
          toast({
            title: "Warning",
            description: "Entry created but image upload failed",
            variant: "destructive"
          });
        }
      }

      toast({
        title: "Success!",
        description: "Diary entry has been created",
      });

      // Reset form
      setFormData({ title: "", content: "" });
      setSelectedImage(null);
      setImagePreview(null);
      setIsCreateDialogOpen(false);

      // Refresh entries
      const q = query(
        collection(db, "DigitalDiary"),
        where("userId", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      const entriesData: DiaryEntry[] = [];
      querySnapshot.forEach((doc) => {
        entriesData.push({ id: doc.id, ...doc.data() } as DiaryEntry);
      });

      // Sort by createdAt on client side (newest first)
      entriesData.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });

      setEntries(entriesData);

    } catch (error) {
      console.error("Error creating diary entry:", error);
      toast({
        title: "Error",
        description: "Failed to create diary entry. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm("Are you sure you want to delete this diary entry?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "DigitalDiary", entryId));
      setEntries(entries.filter(entry => entry.id !== entryId));
      toast({
        title: "Success",
        description: "Diary entry deleted",
      });
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast({
        title: "Error",
        description: "Failed to delete diary entry",
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="max-w-md mx-auto">
          <header className="bg-card p-4 border-b border-border sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <PageHeader />
              <AccountButton />
            </div>
          </header>
          <div className="p-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  Please sign in to access your digital diary
                </p>
                <Button
                  onClick={() => navigate('/authentication/sign-in')}
                  variant="outline"
                >
                  Sign In
                </Button>
              </CardContent>
            </Card>
          </div>
          <BottomNav />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto">
        <header className="bg-card p-4 border-b border-border sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <PageHeader />
            <AccountButton />
          </div>
        </header>

        <div className="p-4 space-y-4">
          {/* Header with Create Button */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">My Digital Diary</h1>
              <p className="text-sm text-muted-foreground">Record your thoughts and memories</p>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              New Entry
            </Button>
          </div>

          {/* Entries List */}
          {fetchingEntries ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : entries.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  No diary entries yet. Start writing your first entry!
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)} variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create First Entry
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <Card key={entry.id} className="border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{entry.title}</CardTitle>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {entry.date}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {entry.time}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEntry(entry.id!)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {entry.imageUrl && (
                      <img
                        src={entry.imageUrl}
                        alt="Diary entry"
                        className="w-full h-48 object-cover rounded-lg mb-3"
                      />
                    )}
                    <p className="text-sm text-foreground whitespace-pre-wrap">{entry.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Create Entry Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>New Diary Entry</DialogTitle>
              <DialogDescription>
                Write about your day, thoughts, or experiences
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateEntry} className="space-y-4">
              {/* Image Upload */}
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <label htmlFor="diary-image" className="cursor-pointer">
                  <div className="flex items-center justify-center h-32 bg-muted rounded-lg hover:bg-muted/80 transition-colors border border-dashed border-border">
                    <div className="text-center">
                      <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Add a photo (optional)</p>
                    </div>
                  </div>
                </label>
              )}
              <input
                id="diary-image"
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title (optional)</Label>
                <Input
                  id="title"
                  placeholder="Give your entry a title..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="border-border"
                />
              </div>

              {/* Content with Speech-to-Text */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="content">Your Entry</Label>
                  <Button
                    type="button"
                    variant={isRecording ? "destructive" : "outline"}
                    size="sm"
                    onClick={toggleRecording}
                    className="gap-2"
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="w-4 h-4" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" />
                        Record
                      </>
                    )}
                  </Button>
                </div>
                <Textarea
                  id="content"
                  placeholder="What's on your mind? (Type or use voice recording)"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="min-h-32 border-border"
                />
                {isRecording && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                    <span>Recording in progress... Speak now</span>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Save Entry
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <BottomNav />
      </div>
    </div>
  );
};

export default DigitalDiary;
