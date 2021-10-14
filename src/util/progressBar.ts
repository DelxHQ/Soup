export function progressbar(total: number, current: number, size: number, line: string, slider: string): string {
  if (current > total) {
    return line.repeat(size + 2)
  } else {
    const percentage = current / total
    const progress = Math.round(size * percentage)
    const emptyProgess = size - progress
    const progressText = line.repeat(progress).replace(/.$/, slider)
    const emptyProgressText = line.repeat(emptyProgess)

    return progressText + emptyProgressText
  }
}