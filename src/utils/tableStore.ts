export function getCurrentDateFormatted() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // months are 0-indexed in JavaScript
    const day = String(date.getDate()).padStart(2, "0");

    const dateInitial = `${year}-${month}-${day} 00:00:00`;
    const dateEnd = `${year}-${month}-${day} 23:59:59`;

    // Use encodeURIComponent to encode the space as %20
    const formattedDateInitial = encodeURIComponent(dateInitial);
    const formattedDateEnd = encodeURIComponent(dateEnd);

    return `dateInitial=${formattedDateInitial}&dateEnd=${formattedDateEnd}`;
}

export function getCurrentDateFormattedReason() {
    const today = new Date()
    const initialDate = new Date(today.setHours(0, 0, 0, 0)) // hoje 00:00:00
    const finalDate = new Date(today.setHours(23, 59, 59, 999)) // hoje 23:59:59            

    const dateInitial = encodeURIComponent(initialDate.toISOString().slice(0, 19).replace("T", " "))
    const dateEnd = encodeURIComponent(finalDate.toISOString().slice(0, 19).replace("T", " "))

    return `dateInitial=${dateInitial}&dateEnd=${dateEnd}`
}

export function getCurrentDateFormattedTicket() {
// retonar o dia de hoje nesse formato: start_date: "2025-08-23 00:00:00"
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // months are 0-indexed in JavaScript
    const day = String(date.getDate()).padStart(2, "0");

    let day_meno_um = Number(day) - 1
    const initialDate = `${year}-${month}-${day} 00:00:00`;
    const dateEnd = `${year}-${month}-${day} 23:59:59`;
    return { start_date: initialDate, end_date: dateEnd }
}