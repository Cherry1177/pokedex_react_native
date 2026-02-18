import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, View } from "react-native";

type PokemonDetails = {
  id: number;
  name: string;
  sprites: {
    other?: { ["official-artwork"]?: { front_default?: string | null } };
    front_default?: string | null;
  };
  types: { type: { name: string } }[];
  stats: { base_stat: number; stat: { name: string } }[];
};

export default function Details() {
  const { name } = useLocalSearchParams<{ name?: string }>();

  const [pokemon, setPokemon] = useState<PokemonDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!name) return;
    fetchPokemonByName(String(name));
  }, [name]);

  async function fetchPokemonByName(pokemonName: string) {
    try {
      setLoading(true);
      setErr(null);

      const res = await fetch(
        `https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}`,
      );
      if (!res.ok) throw new Error("Pokemon not found");

      const data: PokemonDetails = await res.json();
      setPokemon(data);
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const img =
    pokemon?.sprites?.other?.["official-artwork"]?.front_default ??
    pokemon?.sprites?.front_default ??
    null;

  return (
    <>
      <Stack.Screen options={{ title: name ? String(name) : "Details" }} />

      <ScrollView contentContainerStyle={{ gap: 16, padding: 16 }}>
        {loading && <ActivityIndicator />}

        {err && <Text style={{ color: "red" }}>{err}</Text>}

        {pokemon && (
          <>
            <View
              style={{
                alignItems: "center",
                padding: 16,
                borderRadius: 16,
                backgroundColor: "#fff",
              }}
            >
              {img && (
                <Image
                  source={{ uri: img }}
                  style={{ width: 220, height: 220 }}
                  resizeMode="contain"
                />
              )}
              <Text style={{ fontSize: 22, fontWeight: "800" }}>
                {pokemon.name}
              </Text>
              <Text style={{ opacity: 0.5, fontWeight: "700" }}>
                #{String(pokemon.id).padStart(3, "0")}
              </Text>
            </View>

            <View
              style={{ padding: 16, borderRadius: 16, backgroundColor: "#fff" }}
            >
              <Text style={{ fontWeight: "800", marginBottom: 8 }}>Types</Text>
              <Text>{pokemon.types.map((t) => t.type.name).join(", ")}</Text>
            </View>

            <View
              style={{ padding: 16, borderRadius: 16, backgroundColor: "#fff" }}
            >
              <Text style={{ fontWeight: "800", marginBottom: 8 }}>Stats</Text>
              {pokemon.stats.map((s) => (
                <Text key={s.stat.name}>
                  {s.stat.name}: {s.base_stat}
                </Text>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </>
  );
}
