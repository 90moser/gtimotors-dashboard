const GTILogo = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeMap = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-[32px]",
  };

  return (
    <span className={`${sizeMap[size]} font-extrabold tracking-tight`}>
      <span className="text-primary">GTI</span>
      <span className="text-foreground">Motors</span>
    </span>
  );
};

export default GTILogo;
