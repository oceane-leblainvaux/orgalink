function togglePassword(id) {
    let input = document.getElementById(id);
    if (input.type === "password") {
        input.type = "text";
    } else {
        input.type = "password";
    }
}

const openButton = document.querySelector("#openMenu");
const dialog = document.querySelector("#menuDialog");

if (openButton && dialog) {
    openButton.addEventListener("click", () => {
        if (!dialog.open) {
            dialog.showModal();
        } else {
            dialog.close();
        }
    });

    dialog.addEventListener("click", ({ target }) => {
        if (target.nodeName === "DIALOG") {
            dialog.close("dismiss");
        }
    });
}