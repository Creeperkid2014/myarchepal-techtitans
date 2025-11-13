import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FileText, Tag, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { ArticlesService, Article } from "@/services/articles";
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

const EditArticle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isArchaeologist } = useArchaeologist();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [article, setArticle] = useState<Article | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "",
    tags: "",
    imageEmoji: "📄",
    published: true
  });

  useEffect(() => {
    const loadArticle = async () => {
      if (!id) {
        toast({
          title: "Error",
          description: "Article ID not found",
          variant: "destructive"
        });
        navigate("/articles");
        return;
      }

      try {
        setInitialLoading(true);
        const articleData = await ArticlesService.getArticleById(id);

        if (!articleData) {
          toast({
            title: "Error",
            description: "Article not found",
            variant: "destructive"
          });
          navigate("/articles");
          return;
        }

        // Check if user can edit this article
        if (!user || !isArchaeologist || articleData.authorId !== user.uid) {
          toast({
            title: "Permission Error",
            description: "You don't have permission to edit this article",
            variant: "destructive"
          });
          navigate("/articles");
          return;
        }

        setArticle(articleData);
        setFormData({
          title: articleData.title,
          excerpt: articleData.excerpt,
          content: articleData.content,
          category: articleData.category,
          tags: articleData.tags ? articleData.tags.join(", ") : "",
          imageEmoji: articleData.imageEmoji || "📄",
          published: articleData.published
        });

        if (articleData.image) {
          setImagePreview(articleData.image);
        }
      } catch (error) {
        console.error("Error loading article:", error);
        toast({
          title: "Error",
          description: "Failed to load article",
          variant: "destructive"
        });
        navigate("/articles");
      } finally {
        setInitialLoading(false);
      }
    };

    loadArticle();
  }, [id, user, isArchaeologist, navigate, toast]);

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
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(article?.image || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id || !article) {
      toast({
        title: "Error",
        description: "Article not found",
        variant: "destructive"
      });
      return;
    }

    // Basic validation
    if (!formData.title) {
      toast({
        title: "Validation Error",
        description: "Please provide an article title",
        variant: "destructive"
      });
      return;
    }

    if (!user || !isArchaeologist || article.authorId !== user.uid) {
      toast({
        title: "Permission Error",
        description: "You don't have permission to edit this article",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const updateData: {
        title: string;
        excerpt: string;
        content: string;
        category: string;
        tags: string[];
        imageEmoji: string;
        published: boolean;
        updatedAt: Date;
        image?: string;
      } = {
        title: formData.title,
        excerpt: formData.excerpt,
        content: formData.content,
        category: formData.category,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        imageEmoji: formData.imageEmoji,
        published: formData.published,
        updatedAt: new Date()
      };

      // Upload new image if selected
      if (selectedImage) {
        try {
          const imageUrl = await ArticlesService.uploadCoverImage(id, selectedImage);
          updateData.image = imageUrl;
        } catch (imageError) {
          console.error("Error uploading image:", imageError);
          toast({
            title: "Warning",
            description: "Article updated but image upload failed",
            variant: "destructive"
          });
        }
      }

      await ArticlesService.updateArticle(id, updateData);

      toast({
        title: "Success!",
        description: "Your article has been updated successfully",
      });

      // Navigate back to article details after successful update
      setTimeout(() => {
        navigate(`/article/${id}`);
      }, 1500);

    } catch (error) {
      console.error("Error updating article:", error);
      toast({
        title: "Error",
        description: "Failed to update article. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading article...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto">
        <header className="bg-card p-4 border-b border-border sticky top-0 z-10">
          <PageHeader />
        </header>

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
                  {selectedImage ? 'Change Image' : imagePreview ? 'Change Image' : 'Upload Image'}
                </span>
              </Button>
            </label>
          </Card>

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
                    Updating...
                  </>
                ) : (
                  "Update Article"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditArticle;