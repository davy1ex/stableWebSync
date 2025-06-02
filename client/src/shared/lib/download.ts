export const download = (data: string, filename: string) => {
    const a = document.createElement("a")
    a.href = "data:text/json;charset=utf-8," + encodeURIComponent(data)
    a.download = "backup_" + filename + "_" + formatDate() + ".json"
    a.click()
}

const formatDate = (date = new Date()) => {
    const year = date.getFullYear();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}_${day}_${month}_${hours}${minutes}`;
};


export const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      const fileContent = event.target?.result as string;
      console.log("fileContent", fileContent)
      const parsed = JSON.parse(fileContent);
      console.log("parsed", parsed)
      localStorage.setItem("tasks", JSON.stringify(parsed.tasks));
      localStorage.setItem("rewards", JSON.stringify(parsed.rewards));
      localStorage.setItem("projects", JSON.stringify(parsed.projects));
      localStorage.setItem("settings", JSON.stringify(parsed.settings));
      alert("Backup loaded into localStorage.");
    };
    reader.readAsText(file);

    window.location.reload();

}