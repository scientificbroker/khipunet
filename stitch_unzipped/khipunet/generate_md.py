#!/usr/bin/env python3
"""Genera KhipuNet_Base_Datos_CITEs.md a partir de src/data/cites.json."""
import json
from collections import Counter

with open("src/data/cites.json", encoding="utf-8") as f:
    db = json.load(f)

meta, cadenas, cites = db["meta"], {c["id"]: c for c in db["cadenas"]}, db["cites"]
pub = [c for c in cites if c["tipo"] == "publico"]
pri = [c for c in cites if c["tipo"] == "privado"]

L = []
L.append("# KhipuNet — Base de Datos de CITEs del Perú (georreferenciada)\n")
L.append(f"**Proyecto:** {meta['proyecto']}  ")
L.append(f"**Versión:** {meta['version']} · **Fecha de corte:** {meta['fecha_corte']}  ")
L.append(f"**Marco legal:** {meta['marco_legal']}\n")
L.append("> Nodo fundacional de la Red Nacional de Transferencia Tecnológica (mapeo de CITEs, gestores, empresas y startups), prototipo interactivo inspirado en Kumu.\n")
L.append("## 1. Resumen de la red\n")
L.append(f"| Indicador | Valor |\n|---|---|\n| CITEs públicos registrados en esta base | {len(pub)} |\n| CITEs privados registrados en esta base | {len(pri)} |\n| Total de nodos | {len(cites)} |\n")
L.append("Según la Memoria Anual 2023 del ITP, la red pública estaba conformada por 29 centros y unidades técnicas en 25 regiones, con 84,883 servicios tecnológicos brindados a unas 22,755 unidades productivas ese año. En 2026, con la calificación de Natural Fiber's Tech, la red privada alcanzó 14 CITE. Esta base registra los nodos verificables con fuente pública a la fecha de corte; los faltantes deben completarse desde el portal de datos abiertos del ITP (data-peru.itp.gob.pe) y el directorio oficial.\n")

cnt = Counter(c["cadena"] for c in cites)
L.append("### Distribución por cadena productiva\n")
L.append("| Cadena | Color (KhipuNet) | Nodos |\n|---|---|---|")
for cid, cd in cadenas.items():
    L.append(f"| {cd['nombre']} | `{cd['color']}` | {cnt.get(cid, 0)} |")
L.append("")

L.append("## 2. Notas metodológicas\n")
L.append(f"- {meta['nota_coordenadas']}")
L.append("- Los CITE públicos se crean por Resolución Ministerial de PRODUCE; los privados se califican por Resolución Ejecutiva del ITP (vigencia indefinida, revocable por incumplimiento), conforme al DS 004-2016-PRODUCE.")
L.append("- Los campos de contacto marcados como «Ver directorio ITP» deben completarse desde el directorio oficial, pues los responsables y teléfonos rotan con frecuencia.")
L.append("- Campo `estado`: «operativo», «verificar vigencia» o «georreferenciación pendiente».\n")

def ficha(c, n):
    cd = cadenas[c["cadena"]]
    s = [f"### {n}. {c['nombre']}\n"]
    s.append(f"| Campo | Detalle |\n|---|---|")
    s.append(f"| Tipo | CITE {c['tipo']} |")
    s.append(f"| Cadena productiva | {cd['nombre']} |")
    s.append(f"| Región / Ciudad | {c['region']} — {c['ciudad']} |")
    s.append(f"| Dirección | {c['direccion']} |")
    lat, lng = c.get("lat"), c.get("lng")
    coord = f"{lat}, {lng}" if lat is not None else "Pendiente"
    s.append(f"| Coordenadas (lat, lng) | {coord} |")
    ct = c["contacto"]
    s.append(f"| Teléfono | {ct['telefono']} |")
    s.append(f"| Correo | {ct['email']} |")
    s.append(f"| Web | {ct['web']} |")
    s.append(f"| Ámbito de intervención | {', '.join(c['ambito'])} |")
    s.append(f"| Estado | {c['estado']} |")
    s.append(f"| Fuente | {c['fuente']} |\n")
    s.append(f"**Descripción.** {c['descripcion']}\n")
    s.append("**Servicios:** " + " · ".join(c["servicios"]) + "\n")
    return "\n".join(s)

L.append("## 3. CITEs públicos (ITP — PRODUCE)\n")
for i, c in enumerate(pub, 1):
    L.append(ficha(c, i))

L.append("## 4. CITEs privados (calificados por el ITP)\n")
for i, c in enumerate(pri, len(pub) + 1):
    L.append(ficha(c, i))

L.append("## 5. Fuentes oficiales\n")
for s in meta["fuentes"]:
    L.append(f"- {s}")
L.append("\n## 6. Próximos pasos de KhipuNet\n")
L.append("1. Completar la red privada hasta los 14 CITE vigentes y las unidades técnicas (UT) de 2025-2026 (Tacna, Ayacucho, Lambayeque) desde data-peru.itp.gob.pe.")
L.append("2. Incorporar la capa 2 del grafo: gestores de innovación, OTT universitarias, incubadoras y aceleradoras.")
L.append("3. Incorporar la capa 3: empresas y startups vinculadas (clientes de servicios CITE, beneficiarios ProInnóvate/Prociencia).")
L.append("4. Modelar relaciones tipo Kumu: CITE—empresa (servicio), CITE—gestor (asistencia), CITE—fondo (financiamiento).")
L.append("5. Validar coordenadas exactas de sede con visita o Google Places y actualizar `estado`.\n")

out = "/mnt/user-data/outputs/KhipuNet_Base_Datos_CITEs.md"
with open(out, "w", encoding="utf-8") as f:
    f.write("\n".join(L))
print("OK ->", out)
