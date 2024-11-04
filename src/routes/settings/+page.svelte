<script lang="ts">
    import { settings } from "$lib/store";
</script>

<h2>Einstellungen</h2>

<input type="range" bind:value={$settings.zoom} max="1.5" min="1" step=".05">

<p>Benutzeroberflächen-Zoom: <output>{$settings.zoom}</output></p>

<br>

<label for="checkbox-rotate">Rotation: </label>
<input id="checkbox-rotate" type="checkbox" bind:checked={$settings.doRotate}>

<br><br>

<label for="checkbox-rotate">Unterschiedliche Größen: </label>
<input id="checkbox-rotate" type="checkbox" bind:checked={$settings.doScale}>

<style>

</style>
