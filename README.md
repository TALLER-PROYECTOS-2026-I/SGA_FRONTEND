# 1. Siempre partir de dev actualizado
git checkout dev
git pull origin dev

# 2. Crear tu rama
git checkout -b feature/nombre-hu

# 3. Trabajas en tu código...

# 4. Antes de hacer PR, traes lo último de dev (aquí sí aplica el fetch)
git fetch origin
git rebase origin/dev  # o merge, según el equipo

# 5. Push y PR → dev
git push origin feature/nombre-hu
