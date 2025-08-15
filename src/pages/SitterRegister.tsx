import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Upload, CheckCircle } from "lucide-react";

export default function SitterRegister() {
  const { t } = useTranslation();

  return (
    <div className="container py-10">
      <Helmet>
        <title>{t("common.appName")} — {t("sitter.registration")}</title>
        <meta name="description" content="Register as a pet sitter on Nidz" />
      </Helmet>

      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">{t("sitter.registration")}</h1>
          <p className="text-muted-foreground">{t("sitter.registrationSubtitle")}</p>
        </div>

        <div className="space-y-8">
          {/* Profile Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">{t("sitter.profileInfo")}</h2>
            <div className="space-y-4">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
                    <Camera className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <Button size="sm" className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0">
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">{t("sitter.firstName")}</Label>
                  <Input id="firstName" placeholder={t("sitter.firstNamePlaceholder")} />
                </div>
                <div>
                  <Label htmlFor="lastName">{t("sitter.lastName")}</Label>
                  <Input id="lastName" placeholder={t("sitter.lastNamePlaceholder")} />
                </div>
              </div>
              
              <div>
                <Label htmlFor="bio">{t("sitter.bio")}</Label>
                <Textarea 
                  id="bio" 
                  placeholder={t("sitter.bioPlaceholder")}
                  rows={4}
                />
              </div>
              
              <div>
                <Label htmlFor="price">{t("sitter.dailyPrice")}</Label>
                <Input 
                  id="price" 
                  type="number" 
                  placeholder="1000"
                  className="max-w-xs"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {t("sitter.priceRange")}
                </p>
              </div>
            </div>
          </Card>

          {/* Identity Verification */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">{t("sitter.verification")}</h2>
            </div>
            <p className="text-muted-foreground mb-4">{t("sitter.verificationDescription")}</p>
            
            <div className="space-y-4">
              <div>
                <Label>{t("sitter.idCard")}</Label>
                <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">{t("sitter.uploadId")}</p>
                </div>
              </div>
              
              <div>
                <Label>{t("sitter.selfie")}</Label>
                <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                  <Camera className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">{t("sitter.takeSelfie")}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button variant="outline" className="flex-1">
              {t("common.cancel")}
            </Button>
            <Button className="flex-1">
              {t("sitter.submit")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}