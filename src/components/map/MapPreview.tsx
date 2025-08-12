import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function MapPreview() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("mapbox_public_token");
    setToken(t);
  }, []);

  const save = (v: string) => {
    localStorage.setItem("mapbox_public_token", v);
    setToken(v);
  };

  return (
    <div className="w-full">
      {token ? (
        <div className="h-72 rounded-lg bg-gradient-primary shadow-elegant grid place-items-center text-primary-foreground">
          <p>Map enabled soon — using your Mapbox token.</p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Map preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Add a Mapbox public token to enable the interactive map preview. You can also connect Supabase later to manage secrets.
            </p>
            <Input
              placeholder="pk.********"
              onChange={(e) => save(e.target.value)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
