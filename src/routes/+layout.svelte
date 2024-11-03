<script lang="ts">
    import "../styles.css";
    import { page } from "$app/stores";

    const links: any[] = [
        { name: "Hauptseite", path: "/" },
        { name: "Einstellungen", path: "/settings" }
    ];
</script>

<header>
    <h1 class="roboto-italic">Dobble-Karten-Generator</h1>
</header>

<main>
    <nav>
        {#each links as link}
            <a href="{link.path}" class:active={$page.url.pathname === link.path}>{link.name}</a>
        {/each}
    </nav>

    <div id="content">
        <slot></slot>
    </div>
</main>

<div id="background-pane"></div>

<style>
    header {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;

        background-color: rgb(230, 230, 230);
        color: black;
        border-bottom: 3px solid rgb(128, 128, 128);
        white-space: nowrap;

        display: grid;
        justify-items: center;
    }

    nav {
        display: flex;
    }
    nav a {
        background: rgb(128, 128, 128);
        color: white;
        text-decoration: none;

        flex-grow: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: .5rem;
    }
    nav a.active {
        background: rgb(235, 235, 235);
        color: black;
    }
    nav a:not(a.active) {
        box-shadow: inset 0px -.1rem 10px black;
    }

    main {
        border: 1px solid black;
        box-shadow: 5px 5px 0 rgba(0, 0, 0, 0.5);

        max-width: 50rem;
        margin: auto;
        margin-top: 4rem;
        margin-bottom: 5rem;
    }

    #content {
        padding: .5rem;
    }

    #background-pane {
        background: white;
        position: fixed;
        top: 0px;
        left: 0px;
        right: 0px;
        bottom: 0px;
        z-index: -1;
    }
</style>
