/**
 * Avatar d'un membre : photo de profil si définie, sinon initiales
 * sur un dégradé rose. Taille contrôlée par className (h-… w-…).
 */
export function Avatar({
  name,
  avatar,
  className = "h-9 w-9",
}: {
  name: string;
  avatar?: string;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  if (avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatar}
        alt={name}
        className={`${className} shrink-0 rounded-full object-cover ring-1 ring-blush-200`}
      />
    );
  }
  return (
    <span
      className={`${className} flex shrink-0 items-center justify-center rounded-full bg-[linear-gradient(140deg,#e2569a,#a72c69)] font-bold text-white`}
    >
      {initials}
    </span>
  );
}
