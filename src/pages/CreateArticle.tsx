import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Tag, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { AccountButton } from "@/components/AccountButton";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { ArticlesService } from "@/services/articles";
import { AzureOpenAIService } from "@/services/azure-openai";
import { useAuth } from "@/hooks/use-auth";
import { useArchaeologist } from "@/hooks/use-archaeologist";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const categories = ["Research", "Technology", "Conservation", "Methodology", "Environment"];

const CreateArticle = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isArchaeologist, canCreate } = useArchaeologist();
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "",
    tags: "",
    imageEmoji: "📄",
    published: true
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive"
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive"
        });
        return;
      }

      setSelectedImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Start AI analysis
      analyzeImageWithAI(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setAiSummary("");
    setAnalyzingImage(false);
  };

  const analyzeImageWithAI = async (file: File) => {
    try {
      setAnalyzingImage(true);
      console.log('🤖 Starting AI article image analysis...');
      const summary = await AzureOpenAIService.analyzeArticleImage(file);
      setAiSummary(summary);
      toast({
        title: "AI Analysis Complete",
        description: "Image has been analyzed and insights generated",
      });
    } catch (error) {
      console.error('AI analysis error:', error);
      toast({
        title: "AI Analysis Failed",
        description: "Unable to analyze image with AI. You can still upload the image.",
        variant: "destructive"
      });
    } finally {
      setAnalyzingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.title) {
      toast({
        title: "Validation Error",
        description: "Please provide an article title",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be signed in to create articles",
        variant: "destructive"
      });
      return;
    }

    if (!isArchaeologist) {
      toast({
        title: "Permission Error",
        description: "Only verified archaeologists can create articles",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const articleData = {
        title: formData.title,
        excerpt: formData.excerpt,
        content: formData.content,
        category: formData.category,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        imageEmoji: formData.imageEmoji,
        aiSummary: aiSummary || undefined,
        author: user.displayName || user.email || 'Unknown Author',
        authorId: user.uid,
        authorAvatar: user.photoURL || '',
        views: 0,
        likes: 0,
        comments: 0,
        featured: false,
        published: formData.published
      };

      const articleId = await ArticlesService.createArticle(articleData);

      // Upload image if selected
      if (selectedImage && articleId) {
        try {
          const imageUrl = await ArticlesService.uploadCoverImage(articleId, selectedImage);
          await ArticlesService.updateArticle(articleId, { image: imageUrl });
        } catch (imageError) {
          console.error("Error uploading image:", imageError);
          toast({
            title: "Warning",
            description: "Article created but image upload failed",
            variant: "destructive"
          });
        }
      }

      toast({
        title: "Success!",
        description: "Your article has been successfully published",
      });

      // Navigate to articles page after successful creation
      setTimeout(() => {
        navigate("/articles");
      }, 1500);

    } catch (error) {
      console.error("Error creating article:", error);
      toast({
        title: "Error",
        description: "Failed to create article. Please try again.",
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
          <div className="flex items-center justify-between">
            <PageHeader />
            <AccountButton />
          </div>
        </header>

        {/* Auth Status */}
        {!canCreate && (
          <div className="p-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">
                    {!user ? 'Please sign in as an archaeologist to create articles.' :
                     !isArchaeologist ? 'Only verified archaeologists can create articles.' :
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
              </CardContent>
            </Card>
          </div>
        )}

        {/* Form - Only show if user can create */}
        {canCreate && (
        <div className="p-4 space-y-6">
          <Card className="p-6 border-border">
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Cover preview"
                  className="w-full h-48 object-cover rounded-lg mb-4"
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
              <label htmlFor="cover-upload" className="cursor-pointer">
                <div className="flex items-center justify-center h-48 bg-muted rounded-lg mb-4 hover:bg-muted/80 transition-colors">
                  <div className="text-center">
                    <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Click to add cover image</p>
                    <p className="text-xs text-muted-foreground mt-1">Max 5MB (JPG, PNG, GIF)</p>
                  </div>
                </div>
              </label>
            )}
            <input
              id="cover-upload"
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <label htmlFor="cover-upload">
              <Button variant="outline" className="w-full" size="sm" type="button" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  {selectedImage ? 'Change Image' : 'Upload Image'}
                </span>
              </Button>
            </label>
          </Card>

          {/* AI Image Analysis Section */}
          {(selectedImage || aiSummary) && (
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Label className="text-foreground flex items-center gap-2">
                    🤖 AI Image Analysis
                    {analyzingImage && <Loader2 className="w-4 h-4 animate-spin" />}
                  </Label>
                  {aiSummary ? (
                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                      <p className="text-sm text-muted-foreground mb-2">Generated insights:</p>
                      <p className="text-sm">{aiSummary}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        💡 This AI analysis can help inform your article content and provide additional context for your research.
                      </p>
                    </div>
                  ) : analyzingImage ? (
                    <div className="p-4 bg-muted/30 rounded-lg border border-dashed border-border">
                      <p className="text-sm text-muted-foreground">Analyzing image with AI for archaeological insights...</p>
                    </div>
                  ) : (
                    <div className="p-4 bg-muted/20 rounded-lg border border-dashed border-border">
                      <p className="text-sm text-muted-foreground">Upload an image to get AI-generated insights about its archaeological significance.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-foreground">Article Title</Label>
              <Input
                id="title"
                placeholder="e.g., New Dating Techniques for Roman Pottery"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-foreground">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="border-border">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt" className="text-foreground">Excerpt</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Textarea
                  id="excerpt"
                  placeholder="Brief summary of your article (2-3 sentences)"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="pl-10 min-h-20 border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content" className="text-foreground">Article Content</Label>
              <Textarea
                id="content"
                placeholder="Write your full article content here..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="min-h-48 border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags" className="text-foreground">Tags</Label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="tags"
                  placeholder="e.g., Dating Methods, Roman, Pottery (comma-separated)"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="pl-10 border-border"
                />
              </div>
              <p className="text-xs text-muted-foreground">Separate multiple tags with commas</p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  "Publish Article"
                )}
              </Button>
            </div>
          </form>
        </div>
        )}

        <BottomNav />
      </div>
    </div>
  );
};

export default CreateArticle;