<!-- A numeric table cell with a bar showing `value` relative to `max`. -->
<script>
  let {value, max} = $props();
</script>

<td style:--pct="{(value / max) * 100}%">{value}</td>

<style>
  td {
    text-align: right;
    font-variant-numeric: tabular-nums;
    background-image: linear-gradient(to left,
      color-mix(in srgb, var(--yellow-5) 40%, transparent) var(--pct),
      transparent var(--pct));
  }
</style>
