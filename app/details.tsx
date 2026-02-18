import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type PokemonDetails = {
  id: number;
  name: string;
  height: number;
  weight: number;
  sprites: {
    front_default?: string | null;
    front_shiny?: string | null;
    other?: {
      ["official-artwork"]?: { front_default?: string | null };
    };
  };
  types: { type: { name: string } }[];
  stats: { base_stat: number; stat: { name: string } }[];
};

const colorsByType: Record<string, string> = {
  normal: "#A8A77A",
  fire: "#EE8130",
  water: "#6390F0",
  electric: "#F7D02C",
  grass: "#7AC74C",
  ice: "#96D9D6",
  fighting: "#C22E28",
  poison: "#A33EA1",
  ground: "#E2BF65",
  flying: "#A98FF3",
  psychic: "#F95587",
  bug: "#A6B91A",
  rock: "#B6A136",
  ghost: "#735797",
  dragon: "#6F35FC",
  dark: "#705746",
  steel: "#B7B7CE",
  fairy: "#D685AD",
};

const TABS = ["Forms", "Detail", "Types", "Stats"] as const;
type Tab = (typeof TABS)[number];

function titleCase(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
function pad3(n: number) {
  return String(n).padStart(3, "0");
}

// soften a strong hex into a pastel (mix with white)
function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}
function pastel(hex: string, mix = 0.78) {
  const { r, g, b } = hexToRgb(hex);
  const R = Math.round(r + (255 - r) * mix);
  const G = Math.round(g + (255 - g) * mix);
  const B = Math.round(b + (255 - b) * mix);
  return `rgb(${R}, ${G}, ${B})`;
}

export default function Details() {
  const { name } = useLocalSearchParams<{ name?: string }>();
  const pokemonName = String(name ?? "").toLowerCase();

  const [pokemon, setPokemon] = useState<PokemonDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("Forms");

  useEffect(() => {
    if (!pokemonName) return;
    fetchPokemonByName(pokemonName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pokemonName]);

  async function fetchPokemonByName(n: string) {
    try {
      setLoading(true);
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${n}`);
      const data: PokemonDetails = await res.json();
      setPokemon(data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }

  const primaryType = pokemon?.types?.[0]?.type?.name ?? "normal";
  const primaryHex = colorsByType[primaryType] ?? "#A8A77A";

  const pageBg = useMemo(() => pastel(primaryHex, 0.86), [primaryHex]);
  const heroBg = useMemo(() => pastel(primaryHex, 0.72), [primaryHex]);
  const chipBg = useMemo(() => pastel(primaryHex, 0.6), [primaryHex]);

  const heroImage =
    pokemon?.sprites?.other?.["official-artwork"]?.front_default ??
    pokemon?.sprites?.front_default ??
    null;

  const forms = useMemo(() => {
    const items = [
      {
        key: "default",
        label: "Default",
        uri: pokemon?.sprites?.front_default ?? null,
      },
      {
        key: "shiny",
        label: "Shiny",
        uri: pokemon?.sprites?.front_shiny ?? null,
      },
      {
        key: "art",
        label: "Artwork",
        uri:
          pokemon?.sprites?.other?.["official-artwork"]?.front_default ?? null,
      },
    ].filter((x) => !!x.uri);
    return items as { key: string; label: string; uri: string }[];
  }, [pokemon]);

  return (
    <>
      <Stack.Screen
        options={{ title: pokemon ? titleCase(pokemon.name) : "Details" }}
      />

      <ScrollView
        style={{ backgroundColor: pageBg }}
        contentContainerStyle={styles.container}
      >
        {/* Header / Hero */}
        <View style={styles.header}>
          <Text style={styles.name}>
            {pokemon ? titleCase(pokemon.name) : " "}
          </Text>
          <Text style={styles.id}>{pokemon ? pad3(pokemon.id) : ""}</Text>
        </View>

        <View style={[styles.heroCard, { backgroundColor: heroBg }]}>
          <View style={styles.heroInner}>
            {heroImage ? (
              <Image
                source={{ uri: heroImage }}
                style={styles.heroImage}
                resizeMode="contain"
              />
            ) : (
              <ActivityIndicator />
            )}
          </View>

          {/* Type chips */}
          <View style={styles.typesRow}>
            {pokemon?.types?.map((t) => {
              const type = t.type.name;
              const hex = colorsByType[type] ?? primaryHex;
              return (
                <View
                  key={type}
                  style={[
                    styles.typeChip,
                    { backgroundColor: pastel(hex, 0.65) },
                  ]}
                >
                  <Text style={[styles.typeChipText, { color: hex }]}>
                    {titleCase(type)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          {TABS.map((t) => {
            const active = t === tab;
            return (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                style={styles.tabBtn}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {t}
                </Text>
                {active && (
                  <View
                    style={[
                      styles.tabUnderline,
                      { backgroundColor: primaryHex },
                    ]}
                  />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Content */}
        {loading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator />
            <Text style={styles.muted}>Loading…</Text>
          </View>
        )}

        {!loading && pokemon && (
          <>
            {tab === "Forms" && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Forms</Text>
                <View style={styles.formsRow}>
                  {forms.map((f, idx) => (
                    <View
                      key={f.key}
                      style={[
                        styles.formThumb,
                        {
                          backgroundColor:
                            idx === 1 ? chipBg : "rgba(255,255,255,0.7)",
                        },
                      ]}
                    >
                      <Image
                        source={{ uri: f.uri }}
                        style={styles.formImg}
                        resizeMode="contain"
                      />
                    </View>
                  ))}
                </View>

                <View style={{ height: 10 }} />

                <Text style={styles.sectionTitle}>Mega Evolution</Text>
                <Text style={styles.paragraph}>
                  A clean “soft UI” placeholder like the mock. If your tutor
                  later asks for the real Mega text, we’ll fetch Pokémon
                  species/flavor_text from the species endpoint.
                </Text>
              </View>
            )}

            {tab === "Detail" && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Detail</Text>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Height</Text>
                  <Text style={styles.detailValue}>
                    {(pokemon.height / 10).toFixed(1)} m
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Weight</Text>
                  <Text style={styles.detailValue}>
                    {(pokemon.weight / 10).toFixed(1)} kg
                  </Text>
                </View>
              </View>
            )}

            {tab === "Types" && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Types</Text>
                <View style={styles.typesRow}>
                  {pokemon.types.map((t) => {
                    const type = t.type.name;
                    const hex = colorsByType[type] ?? primaryHex;
                    return (
                      <View
                        key={type}
                        style={[
                          styles.typeChip,
                          { backgroundColor: pastel(hex, 0.65) },
                        ]}
                      >
                        <Text style={[styles.typeChipText, { color: hex }]}>
                          {titleCase(type)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {tab === "Stats" && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Stats</Text>

                {pokemon.stats.map((s) => (
                  <View key={s.stat.name} style={styles.statRow}>
                    <Text style={styles.statName}>
                      {s.stat.name.replace("-", " ")}
                    </Text>
                    <View style={styles.statTrack}>
                      <View
                        style={[
                          styles.statFill,
                          {
                            width: `${Math.min(100, (s.base_stat / 200) * 100)}%`,
                            backgroundColor: primaryHex,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.statValue}>{s.base_stat}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    gap: 14,
    paddingBottom: 28,
  },

  header: {
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  name: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1F2937",
    letterSpacing: 0.2,
  },
  id: {
    fontSize: 13,
    fontWeight: "800",
    color: "rgba(31,41,55,0.55)",
  },

  heroCard: {
    borderRadius: 26,
    padding: 14,
  },
  heroInner: {
    borderRadius: 22,
    height: 320,
    backgroundColor: "rgba(255,255,255,0.55)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  heroImage: {
    width: "86%",
    height: "86%",
  },

  tabsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 6,
    marginTop: 2,
  },
  tabBtn: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    minWidth: 60,
  },
  tabText: {
    fontWeight: "800",
    color: "rgba(31,41,55,0.45)",
  },
  tabTextActive: {
    color: "#1F2937",
  },
  tabUnderline: {
    height: 3,
    width: 22,
    borderRadius: 99,
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 22,
    padding: 16,

    // soft shadow
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1F2937",
    marginBottom: 10,
  },

  typesRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 12,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: "900",
  },

  formsRow: {
    flexDirection: "row",
    gap: 12,
  },
  formThumb: {
    flex: 1,
    height: 78,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  formImg: {
    width: "78%",
    height: "78%",
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#1F2937",
    marginTop: 4,
  },
  paragraph: {
    marginTop: 6,
    color: "rgba(31,41,55,0.65)",
    fontWeight: "600",
    lineHeight: 20,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  detailLabel: {
    fontWeight: "800",
    color: "rgba(31,41,55,0.55)",
  },
  detailValue: {
    fontWeight: "900",
    color: "#1F2937",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(31,41,55,0.08)",
  },

  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  statName: {
    width: 90,
    fontWeight: "800",
    color: "rgba(31,41,55,0.6)",
    textTransform: "capitalize",
  },
  statTrack: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(31,41,55,0.08)",
    overflow: "hidden",
  },
  statFill: {
    height: "100%",
    borderRadius: 999,
  },
  statValue: {
    width: 36,
    textAlign: "right",
    fontWeight: "900",
    color: "#1F2937",
  },

  loadingWrap: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 18,
  },
  muted: {
    color: "rgba(31,41,55,0.55)",
    fontWeight: "700",
  },
});
