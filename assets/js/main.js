const popup = document.getElementById("languagePopup");

document.querySelectorAll(".lang-btn").forEach(btn=>{
btn.addEventListener("click",()=>{
popup.style.display="none";
});
});
