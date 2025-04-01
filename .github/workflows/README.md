# **Automated Testing for Penguins-Eggs**  

## **Objective**  

Automate the testing of `penguins-eggs` across multiple operating systems using containerized environments.  

Test all distributions to ensure:  
- **Production readiness**  
- **Stability**  
- **Security**  
- **Comprehensive test coverage**  

**Testing For os listed at:** [Penguins-Eggs Drive](https://penguins-eggs.net/drive)  

---

## **Warnings When Modifying CI Files**  

1. **Do not modify CI files unless you are absolutely sure.**  
2. **Do not make unnecessary changes to CI files.**  
3. **Do not disable any CI tests—every test must remain active.**  
4. **Do not alter the current ISO build workflow.**  
5. **Do not modify existing CI file numbers.** If new tests are required, use a new number range (e.g., `30000-40000`, `50000`).  
6. **If using `penguins-wardrobe` for builds, add new CI tests instead of modifying existing workflows.**  
7. **To modify this file, create a new Pull Request and tag @gnuhub. Do not merge directly.**  
8. **For testing changes, do not modify `master`. Instead, create a new branch (`checkout -b <new-branch>`).**  

This ensures a **stable, safe, and fully tested** CI environment.