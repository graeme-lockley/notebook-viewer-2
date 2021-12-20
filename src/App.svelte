<script lang="ts">
	import XMarkdown from "./XMarkdown.svelte";

	let examples = [
		{ id: 0, text: "Simple Reactive Components", resource: "simple.md" },
		{ id: 1, text: "String Calculater Kata", resource: "sck.md" },
		{ id: 2, text: "D3 Scatterplot", resource: "d3-scatterplot.md" },
		{ id: 3, text: "Diagrams", resource: "kroki-diagrams.md" },
		{ id: 4, text: "Blocks in blocks", resource: "blocks-in-blocks.md" },
	];

	let selectedID = 4;
</script>

<select id="select" bind:value={selectedID}>
	{#each examples as example}
		<option value={example.id}>
			{example.text}
		</option>
	{/each}
</select>

<br />

<XMarkdown sourceURL={examples[selectedID].resource} />
