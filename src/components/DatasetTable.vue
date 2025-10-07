<template>
    <table >
        <thead>
            <tr>
                <th>ID</th>
                <th>Label</th>
                <th>Type</th>
                <th>Latitude</th>
                <th>Longitude</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="node in nodes" :key="node.id">
                <td>{{ node.id }}</td>
                <td>{{ node.label }}</td>
                <td>{{ node.type }}</td>
                <td>{{ node.lat }}</td>
                <td>{{ node.lng }}</td>
            </tr>
        </tbody>
    </table>
</template>

<script>
export default {
    name: 'NodeTable',
    props: {
        nodes: {
            type: Array,
            required: true
        }
    }
}
</script>

<style scoped>
table {
    width: 100%;
    border-collapse: collapse;
}
th, td {
    border: 1px solid #ccc;
    padding: 8px;
    text-align: left;
}
thead {
    background-color: #f5f5f5;
}
</style>