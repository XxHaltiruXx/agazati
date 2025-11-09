function copyText(button) {
  // Megkeresi az aktuális code elemet
  const codeBlock = button.parentElement.querySelector("code");
  const text = codeBlock.innerText.trim();

  // Kimásolja a vágólapra
  navigator.clipboard.writeText(text).then(() => {
    // Ideiglenes visszajelzés (✅ ikon)
    const original = button.innerHTML;
    button.innerHTML = "✅";
    button.classList.add("copied");

    // Visszaállítás 1 másodperc után
    setTimeout(() => {
      button.innerHTML = original;
      button.classList.remove("copied");
    }, 1000);
  }).catch(err => {
    console.error("Másolási hiba:", err);
    alert("A másolás nem sikerült!");
  });
}