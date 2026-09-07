export function SpotifyReleasePlayer({ trackId }: { trackId: string }) {
  return (
    <div style={{ marginTop: 18 }}>
      <p style={{ color: "#86efac", fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", marginBottom: 8 }}>ALSO STREAM ON SPOTIFY</p>
      <iframe
        title="KAIA release on Spotify"
        src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator`}
        width="100%"
        height="152"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        style={{ border: 0, borderRadius: 12 }}
      />
      <p style={{ color: "#94a3b8", fontSize: 11, marginTop: 8 }}>Spotify playback is included for listening; streaming points are tracked through the YouTube player above.</p>
    </div>
  );
}
