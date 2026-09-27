/** Текст, в котором **так** выделяются жирным английские слова и фразы. */
export function RichText({ text }: { text: string }) {
  const parts = text.split("**");
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <strong key={index} className="font-extrabold text-foreground">
            {part}
          </strong>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}
