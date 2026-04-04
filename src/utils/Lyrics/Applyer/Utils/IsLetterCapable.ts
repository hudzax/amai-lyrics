export function IsLetterCapable(letterLength, totalDuration) {
    // Enforce a maximum letter length of 12
    if (letterLength > 12) {
        return false;
    }

    // Calculate the minimum duration based on the letter length
    const minDuration = 1500 + ((letterLength - 1) / 1) * 25; // Increases duration as letter length increases
    
    // Return whether the letter length and duration meet the criteria
    return totalDuration >= minDuration;
}