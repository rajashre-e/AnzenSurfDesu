document.getElementById("fetch").addEventListener("click", async () => {
  const res = await fetch("http://localhost:8000/gmail/classified?batch_size=5");
  const data = await res.json();

  document.getElementById("output").textContent =
    JSON.stringify(data, null, 2);
});
